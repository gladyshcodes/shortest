class DeviceInfo {
  public width: number;
  public height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  static init(): DeviceInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return new DeviceInfo(width, height);
  }
}

export default DeviceInfo;
