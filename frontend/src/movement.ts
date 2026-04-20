export interface Point {
  x: number;
  y: number;
}

export class MovementSystem {
  private currentPosition: Point;
  private targetPosition: Point;
  public isMoving: boolean = false;
  private stepSize: number = 24;
  private updateCallback: (position: Point) => void;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 50;
  private movementTimeout: number | null = null;

  constructor(initialPosition: Point, updateCallback: (position: Point) => void) {
    this.currentPosition = initialPosition;
    this.targetPosition = initialPosition;
    this.updateCallback = updateCallback;
    this.lastUpdateTime = performance.now();
    this.isMoving = false;
  }

  getCurrentPosition(): Point {
    return { ...this.currentPosition };
  }

  getTargetPosition(): Point {
    return { ...this.targetPosition };
  }

  updateCurrentPosition(position: Point) {
    this.currentPosition = { ...position };
    // If we're not moving, update the target position too
    if (!this.isMoving) {
      this.targetPosition = { ...position };
    }
  }

  setTarget(target: Point) {
    console.log('Movement System - setTarget:', {
      currentPosition: this.currentPosition,
      newTarget: target,
      currentTarget: this.targetPosition
    });

    // Round target to nearest step size, but preserve exact floor boundaries
    this.targetPosition = {
      x: Math.round(target.x / this.stepSize) * this.stepSize,
      y: target.y === 300 || target.y === 500 ? target.y : Math.round(target.y / this.stepSize) * this.stepSize
    };
    
    // Clear any existing timeout to prevent old movement from continuing
    if (this.movementTimeout) {
      clearTimeout(this.movementTimeout);
      this.movementTimeout = null;
    }
    
    // Always start movement, even if already moving
    this.isMoving = true;
    this.lastUpdateTime = performance.now();
    this.move();
  }

  private move() {
    if (!this.isMoving) return;

    const now = performance.now();
    const elapsed = now - this.lastUpdateTime;

    if (elapsed >= this.updateInterval) {
      // Get current direction to target
      const dx = this.targetPosition.x - this.currentPosition.x;
      const dy = this.targetPosition.y - this.currentPosition.y;

      // Check if we've reached the target (with a small threshold)
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 1) {
        this.currentPosition = { ...this.targetPosition };
        // Keep isMoving true for 1 second after reaching target
        setTimeout(() => {
          this.isMoving = false;
          this.updateCallback(this.currentPosition);
        }, 500);
        return;
      }

      // Calculate the ratio of movement in each direction
      const ratioX = dx / distance;
      const ratioY = dy / distance;

      // Calculate next position
      let nextX = this.currentPosition.x;
      let nextY = this.currentPosition.y;

      // If we're close to the target, move directly to it
      if (distance < this.stepSize) {
        nextX = this.targetPosition.x;
        nextY = this.targetPosition.y;
      } else {
        // Move in a straight line using the calculated ratios
        nextX += Math.round(ratioX * this.stepSize);
        nextY += Math.round(ratioY * this.stepSize);
      }

      // Update position
      this.currentPosition = {
        x: nextX,
        y: nextY
      };

      // Update visual position
      this.updateCallback(this.currentPosition);

      this.lastUpdateTime = now;
    }

    // Only set new timeout if still moving and no timeout exists
    if (this.isMoving && !this.movementTimeout) {
      this.movementTimeout = window.setTimeout(() => {
        this.movementTimeout = null;
        this.move();
      }, this.updateInterval);
    }
  }

  getPosition(): Point {
    return { ...this.currentPosition };
  }

  stop() {
    this.isMoving = false;
    if (this.movementTimeout) {
      clearTimeout(this.movementTimeout);
      this.movementTimeout = null;
    }
    this.updateCallback(this.currentPosition);
  }
} 