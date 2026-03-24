/**
 * a progress bar
 * @example
 * const total = 100;
 * const ms = 10;
 * const pb = new ProgressBar({ desc: "Progressbar example", total: total });
 * const sleep = (pb, i) => {
 *     pb.update(i);
 *     return new Promise((res, rej) => setTimeout(res, ms));
 * };
 * for (let i=0; i<=total; i++) {
 *     await sleep(pb, i);
 * }
 */
class ProgressBar {
  constructor(options = {
    desc: "Progress",
    total: 100
  }) {
    this.desc = options.desc
    this.total = options.total
    this.current = 0;
    this.startTime = Date.now();
  }

  update(current) {
    this.current = Math.min(current, this.total);
    this.render();
  }

  render() {
    const terminalWidth = process.stdout.columns || 80;

    const percent = this.total === 0 ? 100 : (this.current / this.total) * 100;
    const percentStr = percent.toFixed(1) + "%";

    // calculate elapsed and estimated time
    const elapsedTime = Date.now() - this.startTime;
    const elapsedSec = Math.floor(elapsedTime / 1000);
    const rate = this.current / (elapsedTime / 1000);
    const remainingTime = rate > 0 ? Math.floor((this.total - this.current) / rate) : 0;

    const timeStr = `${this.formatTime(elapsedSec)}/${this.formatTime(remainingTime)}`;
    const countStr = `${this.current}/${this.total}`;

    // calculate available space for bar
    const prefix = `${this.desc} [`;
    const suffix = `] ${percentStr} ${countStr} ${timeStr}`;
    const availableWidth = terminalWidth - prefix.length - suffix.length;

    if (availableWidth < 10) {
      process.stdout.write(`\r${this.desc}: ${percentStr}`);
      return;
    }

    // build progress bar
    const filledWidth = Math.floor((this.current / this.total) * availableWidth);
    const emptyWidth = availableWidth - filledWidth;
    const bar = "█".repeat(filledWidth) + "░".repeat(emptyWidth);

    // build and display complete line
    const line = prefix + bar + suffix;
    process.stdout.write("\r" + line);

    // new line when complete
    if (this.current === this.total) {
      process.stdout.write("\n");
    }
  }

  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}h${m}m`;
    } else if (m > 0) {
      return `${m}m${s}s`;
    } else {
      return `${s}s`;
    }
  }
}

export default ProgressBar