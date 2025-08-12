import { Logger } from './logger';

export interface PerformanceMetrics {
  checkDuration?: number;
  downloadDuration?: number;
  downloadSize?: number;
  installDuration?: number;
  totalDuration?: number;
  networkSpeed?: number; // bytes per second
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private readonly logger: Logger;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private timers: Map<string, number> = new Map();

  private constructor() {
    this.logger = Logger.getInstance();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTimer(operation: string, version?: string): void {
    const key = version ? `${operation}-${version}` : operation;
    this.timers.set(key, Date.now());
    this.logger.debug(`Performance timer started: ${key}`);
  }

  /**
   * End timing an operation
   */
  endTimer(operation: string, version?: string): number {
    const key = version ? `${operation}-${version}` : operation;
    const startTime = this.timers.get(key);
    
    if (!startTime) {
      this.logger.warn(`No timer found for: ${key}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(key);
    
    // Update metrics
    const metrics = this.metrics.get(version || 'current') || {};
    
    switch (operation) {
      case 'check':
        metrics.checkDuration = duration;
        break;
      case 'download':
        metrics.downloadDuration = duration;
        break;
      case 'install':
        metrics.installDuration = duration;
        break;
      case 'total':
        metrics.totalDuration = duration;
        break;
    }
    
    this.metrics.set(version || 'current', metrics);
    this.logger.debug(`Performance timer ended: ${key} = ${duration}ms`);
    
    return duration;
  }

  /**
   * Record download metrics
   */
  recordDownload(version: string, size: number, duration: number): void {
    const metrics = this.metrics.get(version) || {};
    metrics.downloadSize = size;
    metrics.downloadDuration = duration;
    metrics.networkSpeed = size / (duration / 1000); // bytes per second
    
    this.metrics.set(version, metrics);
    
    this.logger.info('Download performance', {
      version,
      size: `${(size / 1024 / 1024).toFixed(2)} MB`,
      duration: `${(duration / 1000).toFixed(2)}s`,
      speed: `${(metrics.networkSpeed / 1024 / 1024).toFixed(2)} MB/s`,
    });
  }

  /**
   * Get metrics for a version
   */
  getMetrics(version?: string): PerformanceMetrics | undefined {
    return this.metrics.get(version || 'current');
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Clear metrics
   */
  clearMetrics(version?: string): void {
    if (version) {
      this.metrics.delete(version);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Calculate optimal download chunk size based on network speed
   */
  getOptimalChunkSize(): number {
    const recentMetrics = Array.from(this.metrics.values()).slice(-3);
    
    if (recentMetrics.length === 0) {
      return 1024 * 1024; // Default 1MB chunks
    }

    const avgSpeed = recentMetrics
      .filter(m => m.networkSpeed)
      .reduce((sum, m) => sum + (m.networkSpeed || 0), 0) / recentMetrics.length;

    // Adjust chunk size based on speed
    if (avgSpeed > 10 * 1024 * 1024) { // > 10 MB/s
      return 5 * 1024 * 1024; // 5MB chunks
    } else if (avgSpeed > 5 * 1024 * 1024) { // > 5 MB/s
      return 2 * 1024 * 1024; // 2MB chunks
    } else if (avgSpeed > 1 * 1024 * 1024) { // > 1 MB/s
      return 1024 * 1024; // 1MB chunks
    } else {
      return 512 * 1024; // 512KB chunks for slow connections
    }
  }

  /**
   * Check if device has sufficient performance
   */
  async checkDevicePerformance(): Promise<{
    cpuCores: number;
    memory: number;
    storage: number;
    suitable: boolean;
  }> {
    const cpuCores = navigator.hardwareConcurrency || 1;
    
    // Estimate available memory (if available)
    const memory = (navigator as any).deviceMemory || 4; // GB
    
    // Check storage (placeholder - implement per platform)
    const storage = 1000; // MB - placeholder
    
    const suitable = cpuCores >= 2 && memory >= 2 && storage >= 100;
    
    return {
      cpuCores,
      memory,
      storage,
      suitable,
    };
  }
}