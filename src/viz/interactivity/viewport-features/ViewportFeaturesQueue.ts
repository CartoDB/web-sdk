export class ViewportFeaturesQueue {
  private queue: Record<string, (arg0: any) => void>[] = [];

  public enqueue(): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        resolve,
        reject
      });
    });
  }

  public resolveQueue(features: Record<string, unknown>[]) {
    this.queue.forEach(q => {
      q.resolve(features);
    });
    this.queue.splice(0, this.queue.length);
  }

  public clearQueue() {
    this.queue.forEach(q => {
      q.reject('Cancel local viewport get features');
    });
    this.queue.splice(0, this.queue.length);
  }

  public isQueueEmpty() {
    return this.queue.length === 0;
  }
}
