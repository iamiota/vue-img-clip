<template>
  <div class="box-img-upload">
    <label class="label-img-upload" for="file">
        <div class="bg-img-upload"
          v-bind:style="setImgLocal">
        </div>
    </label>
    <input style="display:none;" 
      type="file"
      name="file"
      accept="image/*"
      id="file"
      class="input-img-upload j-input-img-upload" />
  </div>

  <!-- 图片剪裁 -->
  <div v-show="isClip" class="box-clip-img-upload">
      <div class="area-clip-img-upload" 
          v-touch:panstart="imgClipStart($event)" 
          v-touch:pan="imgCliping($event)">
          <img :src="imgClipTemp"
            alt="" 
            class="j-current-clip-img-upload current-clip-img-upload" 
            v-bind:style="setClipImgPosition"/>
      </div>
      <div class="btn-box">
          <i v-touch:tap="imgClipSave()" 
            class="btn-img-save iconfont">&#xe603;</i>
          <i v-touch:tap="imgClipCancel()" 
            class="btn-img-cancel iconfont">&#xe604;</i>
      </div>
  </div>
</template>

<script>


/**
 *  图片上传组件
 *  
 *  HTML部分
 * <img-upload
 *   :img-path.sync="imgPath"
 *   :upload-Api="uploadApi"
 *   @upload-with-native="uploadWithNative">
 * </img-upload>
 *
 *  JS部分
 * let v = new Vue({
 *   el: '#foo',
 *   ready: function() {
 *   },
 *   data: {
 *     imgPath: undefined // 这个值即为上传后的图片地址
 *     uploadApi: 'xxxxxx/foo/upload' // 图片上传地址
 *     uploadWithNative: function() {
 *         // Android下面调用Native方法
 *         WebViewJavascriptBridge
 *         balabala
 *     }
 *   },
 *   components: { 
 *     'img-upload': imgUpload
 *   }
 *  });
 */

  import Vue from 'vue';
  import VueResource from 'vueResource';
  import ImgCompress from 'imgCompress';
  import VueTouch from 'vueTouch';
  import Utils from 'utils';   // 自己封装的一些常用功能

  Vue.use(VueResource);
  Vue.use(VueTouch);
  VueTouch.config.swipe = {
    threshold: 200
  };

  export default {
    ready: function() {
      this.$img = document.querySelector('.j-current-clip-img-upload');
      this.$input = document.querySelector('.j-input-img-upload');
      this.$imgLocal = document.querySelector('.bg-img-upload');

      window.uploadCallback = (imgPath) => {
        let arrName = imgPath.split('/'),
          imgName = arrName[arrName.length - 1],
          imgClip = new ImgCompress(imgPath);
        imgClip.init()
          .then((res) => {
            this.c = res;
            let w = document.body.getBoundingClientRect().width || document.body.offsetWidth,
              cW = this.c.imgInfo.naturalWidth,
              cH = this.c.imgInfo.naturalHeight;
            this.c.imgName = imgName;
            if (cW < cH) {
              this.onlyMoveY = true;
              this.$img.style.width = `${w}px`;
              this.w = w;
            } else {
              this.onlyMoveX = true;
              this.$img.style.height = `${w}px`;
              this.h = w;
            }
            this.imgClipTemp = res.imgInfo.base64;
            this.isClip = true;
          });
      };

      let UA = navigator.userAgent.toLowerCase(),
        reg = new RegExp(/iphone os 8_/);
      const init = () => {
          if (Utils.getQueryString('native') &&
              Utils.getClient(true) === 'Android') {
            $imgLocal.addEventListener('click', () => {
                this.uploadWithNative();
            });
          } else {
            if (reg.test(UA)) {
              this.uploadIOS8.call(this);
            } else {
              this.uploadCommon.call(this);
            }
          }
        };

      init();
    },
    props: ['img-path', 'upload-with-native', 'upload-api'],
    data: function() {
      return {
        $img: undefined,
        $input: undefined,
        $imgLocal: undefined,
        isClip: false,
        c: null,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        lastX: 0,
        lastY: 0,
        onlyMoveY: false,
        onlyMoveX: false,
        imgUpload: undefined,
        imgLocal: undefined,
        imgClipTemp: undefined
      };
    },
    methods: {
      // 图片上传
      uploadCommon() {
        this.$input.addEventListener('change', (e) => {
          let file = e.target.files[0],
            imgData = new ImgCompress(file);
          imgData.init()
          .then((res) => {
            this.c = res;
            this.c.imgName = res.file.name;
            let w = document.body.getBoundingClientRect().width || document.body.offsetWidth,
              cW = this.c.imgInfo.naturalWidth,
              cH = this.c.imgInfo.naturalHeight;
            if (cW < cH) {
              this.onlyMoveY = true;
              this.$img.style.width = `${w}px`;
              this.w = w;
            } else {
              this.onlyMoveX = true;
              this.$img.style.height = `${w}px`;
              this.h = w;
            }
            this.imgClipTemp = res.imgInfo.base64;
            this.isClip = true;
          })
        })
      },
      // iOS8 特殊处理
      uploadIOS8() {
        this.$input.addEventListener('change', (e) => {
          let formData = new FormData(),
            file = e.target.files[0];
          formData.append('file', file, file.name);
          this.$http.post(this.uploadApi, formData, {
            headers: {
              "Content-Type": "multipart/form-data;"
            }
          })
          .then((res) => {
            // 上传成功判定，自行修改
            if (res.data.code === "1") {
              this.imgPath = res.data.filePath;
              this.imgLocal = res.data.filePath;
              this.clearClip.call(this);
            } else {
            }
          });
        });
      },
      // 清除
      clearClip() {
        this.$input.value = '';
        this.$img.style.width = 'auto';
        this.$img.style.height = 'auto';
        this.w = 0;
        this.h = 0;
        this.x = 0;
        this.y = 0;
        this.lastX = 0,
        this.lastY = 0,
        this.onlyMoveY = false;
        this.onlyMoveX = false;
        this.$img.setAttribute('src', '');
      },
      // 裁剪开始
      imgClipStart(e) {
        this.w = this.$img.offsetWidth;
        this.h = this.$img.offsetHeight;
      },
      // 裁剪拖动
      imgCliping(e) {
        let w = document.documentElement.getBoundingClientRect().width || window.innerWidth,
          tX = e.deltaX,
          tY = e.deltaY,
          $domImgW = this.w,
          $domImgH = this.h;
        if (!this.onlyMoveY) {
            this.x = tX + this.lastX;
        }
        if (!this.onlyMoveX) {
            this.y = tY + this.lastY;
        }
        if (e.isFinal) {
          // X轴超过边界
          if (this.x > 0 || $domImgW - Math.abs(this.x) < w ) {
            if (this.x > 0) {
              this.x = 0;
            } else {
              this.x = -($domImgW - w);
            }
          }
          // Y轴超过边界
          if (this.y > 0 || $domImgH - Math.abs(this.y) < w ) {
            if (this.y > 0) {
              this.y = 0;
            } else {
              this.y = -($domImgH - w);
            }
          }
          this.lastX = this.x;
          this.lastY = this.y;
        }
      },
      // 裁剪保存
      imgClipSave() {
        let $domImgW = this.$img.offsetWidth,
          $domImgH = this.$img.offsetHeight;
        this.w = $domImgW;
        this.h = $domImgH;
        let self = this,
          w = this.w <= this.h ? Math.abs(this.w) : Math.abs(this.h),
          x = Math.abs(this.x),
          y = Math.abs(this.y),
          r = this.c.imgInfo.naturalWidth / this.w,
          data = this.c.clip(x*r, y*r, w*r, w*r),
          reader = new FileReader(),
          formData = new FormData();
        reader.onload = function(){
          self.imgUpload = this.result;
        }
        reader.readAsDataURL(data);
        let imgName = this.c.file.name || this.c.imgName;
        formData.append('file', data, imgName);
        this.isClip = false;
        this.$http.post(this.uploadApi, formData, {
          headers: {
            "Content-Type": "multipart/form-data;"
          }
        })
        .then((res) => {
          // 上传成功判定，自行修改
          if (res.data.flag === "1") {
            this.imgClipTemp = undefined;
            this.imgPath = res.data.filePath;
            this.imgLocal = res.data.filePath;
            this.clearClip.call(this);
          } else {
          }
        }, (res) => {})
      },
      // 裁剪取消
      imgClipCancel() {
        this.isClip = false;
        this.imgClipTemp = undefined;
        this.clearClip.call(this);
      }
    },
    computed: {
      setImgLocal() {
        return { 
          backgroundImage: `url("${this.imgLocal}")`
        }
      },
      setClipImgPosition() {
        let x = this.x,
          y = this.y;
        return {
          "transform": `translate3d(${x}px, ${y}px, 0)`,
          "-ms-transform": `translate3d(${x}px, ${y}px, 0)`,
          "-moz-transform": `translate3d(${x}px, ${y}px, 0)`,
          "-webkit-transform": `translate3d(${x}px, ${y},px 0)`,
          "-o-transform": `translate3d(${x}px, ${y}px, 0)`
        }
      }
    }
  }
</script>