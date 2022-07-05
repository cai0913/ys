(function(document, window) {
    //对外暴露接口
    let Img = function(options) {
        //1.初始化
        this._init(options);
        //2.构造DOM结构
        this._createDOM();
        //3.绑定事件
        this._bindEvent();
        //4.显示
        this._show();
    };
    window.$isg_Img = Img;

    //常用方法
    let methods = {
        $: function(selector, root = document) {
            return root.querySelector(selector);
        },
        $$: function(selector, root = document) {
            return root.querySelectorAll(selector);
        },
        appendChildren: function(parent, ...children) {
            children.forEach(child => {
                parent.appendChild(child);
            })
        }
    }

    Img.prototype._init = function({ data, curType, parasitifer }) {
        this.curType = curType; //当前分类
        this.wrapEL = methods.$(parasitifer); //挂载点

        this.allImgSrcs = [];
        this.categoryMap = { '全部': [] };
        //数据清洗
        this._classifyData(data);

        this.wrapContainerEL = null; //接口生成的模板
        this.imgContainerEl = null; //照片div
        this.figureEls = []; //当前的照片
        this.categoryBtnEls = []; //按钮例表

        this.previewImgFigureEl = null; //当前预览的图片
        this.overlay = null; //遮罩层
    }

    Img.prototype._classifyData = function(data) {
        data.forEach(({ type, src, alt, title }) => {
            // let figureEl = `
            //     <figure>
            //         <img src="${src}" alt="${alt}">
            //         <figcaption>${title}</figcaption>
            //     </figure>
            // `;
            let figure = document.createElement('figure');
            let img = document.createElement('img');
            img.src = src;
            img.alt = alt;
            let figcaption = document.createElement('figcaption');
            figcaption.innerText = title;
            methods.appendChildren(figure, img, figcaption);

            if (!Object.keys(this.categoryMap).includes(type)) {
                this.categoryMap[type] = [];
            }
            this.categoryMap[type].push(figure);
            if (this.allImgSrcs.indexOf(src) === -1) {
                this.allImgSrcs.push(src);
                this.categoryMap['全部'].push(figure);
            }
        })
    }


    Img.prototype._createDOM = function() {
        this.wrapContainerEL = document.createElement('div');
        this.wrapContainerEL.className = 'isg__Img__container';
        //category
        let categoryBtns = [];
        Object.keys(this.categoryMap).forEach(item => {
                categoryBtns.push(item === this.curType ?
                    `<li class="isg__Img_container__category-btn isg__Img_container__category-btn-active">${item}</li>` :
                    `<li class="isg__Img_container__category-btn">${item}</li>`);
            })
            // warpHTML模板
        let wrapContainerTemplete = `
            <ul class="isg__Img_container__category">
                 ${categoryBtns.join('')}
            </ul>
            <div class="isg__Img_container__imgcontainer">
            </div>
            <div class="isg__Img__overlay">
                <div class="isg__Img__overlay-btn-prev"></div>
                <div class="isg__Img__overlay-btn-next"></div>
                <img src="" alt="" width="300px">
            </div>
        `;
        this.wrapContainerEL.innerHTML = wrapContainerTemplete;
        this.imgContainerEl = methods.$('.isg__Img_container__imgcontainer', this.wrapContainerEL);
        this.categoryBtnEls = methods.$$('.isg__Img_container__category-btn', this.wrapContainerEL);
        this.figureEls = this.categoryMap[this.curType];
        methods.appendChildren(this.imgContainerEl, ...this.figureEls);
        setTimeout(() => {
            this.figureEls.forEach(figure => {
                figure.style.transform = 'scale(0, 0) translate(0, -100%)';
                figure.style.opacity = '0';
            });
        });

        //初始化遮罩层
        this.overlay = methods.$('.isg__Img__overlay', this.wrapContainerEL);
    }

    Img.prototype._bindEvent = function() {
        //先绑定按钮
        methods.$('.isg__Img_container__category', this.wrapContainerEL).addEventListener('click', ({ target }) => {
            if (target.nodeName !== 'LI') return;
            this.curType = target.innerText;
            this.categoryBtnEls.forEach(btn => btn.className = 'isg__Img_container__category-btn');
            target.className = 'isg__Img_container__category-btn isg__Img_container__category-btn-active';
            let oldFigureEls = this.figureEls;
            let newFigureEls = this.categoryMap[this.curType];
            let needRemoveFigureEls = [];
            let needAddFigureEls = [];
            oldFigureEls.forEach(figure => {
                //需要删除的 
                if (newFigureEls.indexOf(figure) === -1) needRemoveFigureEls.push(figure);
            });
            newFigureEls.forEach(figure => {
                //需要新增的
                if (oldFigureEls.indexOf(figure) === -1) needAddFigureEls.push(figure);
            });
            needAddFigureEls.forEach(figure => {
                figure.style.transform = 'scale(0, 0) translate(0, -100%)';
                figure.style.opacity = '1';
            });
            needRemoveFigureEls.forEach(figure => {
                this.imgContainerEl.removeChild(figure);
            });
            methods.appendChildren(this.imgContainerEl, ...needAddFigureEls);
            setTimeout(() => {
                needAddFigureEls.forEach(figure => {
                    figure.style.transform = 'scale(1, 1) translate(0, 0)';
                    figure.style.opacity = '1';
                }, 600);
            });
            this.figureEls = newFigureEls;
        });

        //绑定figures
        methods.$$('figure', this.imgContainerEl).forEach(figure => {
            figure.addEventListener('click', ({ target }) => {
                if (target.nodeName === 'FIGCAPTION') target = target.parentNode;
                this.previewImgFigureEl = target;
                methods.$('img', this.overlay).src = methods.$('img', target).src;
                setTimeout(() => {
                    this.overlay.style.display = 'flex';
                    this.overlay.style.opacity = '1';
                });
            });
        });
        //绑定遮罩层
        this.overlay.addEventListener('click', ({ target }) => {
            //如果是图片，遮罩不消失
            if (target.nodeName === 'IMG') return;
            if (target.className.startsWith('isg__Img__overlay-btn')) {
                //上一张 下一张
                let index = this.figureEls.indexOf(this.previewImgFigureEl);
                if (target.className === 'isg__Img__overlay-btn-prev') { //上一张
                    index--;
                    if (index < 0) index = this.figureEls.length - 1;
                } else if (target.className === 'isg__Img__overlay-btn-next') { //下一张
                    index++;
                    if (index > (this.figureEls.length - 1)) index = 0;
                }
                this.previewImgFigureEl = this.figureEls[index];
                methods.$('img', this.overlay).src = methods.$('img', this.previewImgFigureEl).src;
                return;
            }
            //遮罩消失
            setTimeout(() => {
                this.overlay.style.display = 'none';
                this.overlay.style.opacity = '0';
            });
        });
        //绑定遮罩层 上一张、下一张
        // methods.$('.isg__Img__overlay-btn-prev', this.overlay).addEventListener('click', e => {
        //     //阻止事件冒泡
        //     e.stopPropagation();
        //     //上一张
        //     let index = this.figureEls.indexOf(this.previewImgFigureEl);
        //     index--;
        //     if (index < 0) index = this.figureEls.length - 1;
        //     this.previewImgFigureEl = this.figureEls[index];
        //     methods.$('img', this.overlay).src = methods.$('img', this.previewImgFigureEl).src;
        // });

    }
    Img.prototype._show = function() {
        methods.appendChildren(this.wrapEL, this.wrapContainerEL);
        setTimeout(() => {
            this.figureEls.forEach(figure => {
                figure.style.transform = 'scale(1, 1) translate(0, 0)';
                figure.style.opacity = '1';
            });
        }, 600);

    }

})(document, window);