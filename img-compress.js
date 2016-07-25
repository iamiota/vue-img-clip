class Compress {

  constructor(file, opts) {
    if (!window.FileReader || !window.Blob) {
      return console.warn('您的浏览器不支持图片压缩');
    }

    let config = Object.assign({
        file: file,
        reader: new FileReader(),
        quality: 0.5,       // 压缩系数
        mimeType: file.type,  // 读取文件类型
        imageInfo: null,  // 保存图片信息，包括处理前和处理后
        orientation: 1,  // 图片方向
    }, opts);
    for (let key in config) {
      this[key] = config[key];
    }
  }

  init() {
    if (typeof this.file === 'string') {
      let arrType = this.file.split('.');
      this.mimeType =arrType[arrType.length - 1];
      return this.initWithImagePath();
    } else {
      return this.initWithImageFile();
    }
  }

  // 图片地址初始化
  initWithImagePath() {
    let self = this,
      img = new Image(),
      canvas = document.createElement('canvas'),
      ctx = null,
      imgCompressData = undefined,
      blobData = undefined;
    img.crossOrigin = "Anonymous"; // 跨域加载

    let promise = new Promise((resolve, reject) => {
      img.onload = function() {
        /**
         * this 为 img
         * self 为 class
         */
        canvas.width = this.naturalWidth;
        canvas.height = this.naturalHeight;
        ctx = canvas.getContext('2d');
        ctx.drawImage(this, 0, 0);
        imgCompressData = canvas.toDataURL(self.mimeType, self.quality);
        blobData = self.dataURIToBlob(imgCompressData);
        self.ctx = ctx;
        self.canvas = canvas;
        self.imageInfo = {
          naturalWidth: this.naturalWidth,
          naturalHeight: this.naturalHeight,
          base64: imgCompressData,
          blobData: blobData
        }
        resolve(self);
      }

      img.onerror = (res) => {
        reject(res);
      }
    });

    img.src = this.file;

    return promise;
  }

  // 图片文件初始化
  initWithImageFile() {
    let self = this,
      img = new Image(),
      promise = new Promise((resolve, reject) => {
        this.reader.onload = function() {
          let dataURL = this.result;
          img.onload = function() {
            /**
             * this 为 img
             * self 为 class
             */
            let canvas = document.createElement('canvas'),
              ctx = null,
              imgCompressData = undefined,
              blobData = undefined,
              width = this.naturalWidth,
              height = this.naturalHeight;
            ctx = canvas.getContext('2d');
            ctx.save();
            switch (self.orientation) {
              case 1:
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(this, 0, 0);
                break;
              case 6:
                canvas.width = height;
                canvas.height = width;
                ctx.rotate(90 * Math.PI / 180);
                ctx.drawImage(this, 0, -height);
                break;
              case 8:
                canvas.width = width;
                canvas.height = height;
                ctx.rotate( -90 * Math.PI / 180);
                ctx.drawImage(this, -width, -height);
                break;
              case 3:
                canvas.width = height;
                canvas.height = width;
                ctx.rotate(2 * 90 * Math.PI / 180);
                ctx.drawImage(this, -width, 0);
                break;
              default: 
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(this, 0, 0);
            }
            ctx.restore();
            imgCompressData = canvas.toDataURL(self.mimeType, self.quality);
            blobData = self.dataURIToBlob(this.getAttribute('src'));
            self.ctx = ctx;
            self.canvas = canvas;
            self.imageInfo = {
              naturalWidth: canvas.width,
              naturalHeight: canvas.height,
              base64: imgCompressData,
              blobData: blobData
            }
            resolve(self);
          }

          img.onerror = function(res) {
            reject(res);
          }
          img.src = dataURL;
        }

        this.reader.onerror = (res) => {
          console.warn(res);
        }

        this.reader.readAsDataURL(this.file);
    });

    return promise;
  }

  dataURIToBlob(dataURI) {
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
      byteString = atob(dataURI.split(',')[1]);
    } else {
      byteString = unescape(dataURI.split(',')[1]);
    }
    let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0],
      ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type:mimeString});
  }

  clip(left, top, width, heigh, quality = 0.5) {
    let data = this.ctx.getImageData(left, top, width, heigh),
      canvas = document.createElement('canvas'),
      ctx,
      dataURI,
      result;
    canvas.width = width;
    canvas.height = heigh;
    ctx = canvas.getContext('2d');
    ctx.putImageData(data, 0, 0);
    dataURI = canvas.toDataURL(this.mimeType, quality);
    result = this.dataURIToBlob(dataURI);

    return result;
  }
}


module.exports = Compress;




