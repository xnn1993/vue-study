/*
* @file vdom的创建 + 渲染
* */


const VNODE_TYPE = {
    HTML: 'HTML',
    COMPONENT: 'COMPONENT',
    TEXT: 'TEXT'
};

const CHILDREN_VNODE_TYPE = {
    EMPTY: 'EMPTY',
    SINGLE: 'SINGLE',
    MUTIPLE: 'MUTIPLE'
}

function getFlag(tag) {
    if (typeof tag === 'string') {
        return VNODE_TYPE.HTML;
    } else if(typeof tag === 'function') {
        return VNODE_TYPE.COMPONENT;
    } else {
        return VNODE_TYPE.TEXT;
    }
}

function getChildrenFlag(children = null) {
    if (children==null) {
        return CHILDREN_VNODE_TYPE.EMPTY;
    } else if (Array.isArray(children)) {
        if (!children.length) {
            return CHILDREN_VNODE_TYPE.EMPTY;
        } else {
            return CHILDREN_VNODE_TYPE.MUTIPLE;
        }
    } else { //其他情况默认是文本，用SINGLE表示
        return CHILDREN_VNODE_TYPE.SINGLE;
    }
}

//创建一个文本类型的vnode
function createTextVnode(text) {
    return {
        flag: VNODE_TYPE.TEXT,
        tag: null,
        data: null,
        children: text,
        childrenFlag: CHILDREN_VNODE_TYPE.EMPTY
    };
}

/*新建虚拟DOM
* @params tag -- 标签
*         data -- 属性
*         children -- 子元素
* @return 返回一个虚拟dom对象
* */
function createElement(tag, data, children){
    let flag = getFlag(tag);
    let childrenFlag = getChildrenFlag(children);

    //文本子节点需要创建一个文本的虚拟DOM
    if(childrenFlag === CHILDREN_VNODE_TYPE.SINGLE) {
        children = createTextVnode(children);
    }

    return {
        el: null,
        key: data && data.key,
        flag, //vnode类型
        tag, //标签，文本标签没有tag，组件就是函数
        data,
        children,
        childrenFlag //标记子节点类型
    }
}


// ----------------   上为vnode的创建  ---  下为vnode的渲染  ----------------





/*渲染虚拟DOM
* @param  vnode - 要渲染的虚拟dom
*         container - 容器
* */
function render(vnode, container) {
    //区分首次渲染 和 再次渲染（需要进行diff）
    if(container.vnode) {
        //更新
        patch(container.vnode, vnode, container);
    } else {
        //首次渲染
        mount(vnode, container);
    }

    container.vnode = vnode;
}

/*
* 更新
* params： oldVnode - 更新前的虚拟dom
*          vnode - 更新后的虚拟dom
*          container - 容器
* */
function patch(oldVnode, vnode, container) {
    let nextFlag = vnode.flag;
    let prevFlag = oldVnode.flag;

    //若节点类型不一致，直接更新
    if (nextFlag !== prevFlag) {
        replaceVnode(oldVnode, vnode, container);
    } else if (nextFlag === VNODE_TYPE.HTML) {
        patchElement(oldVnode, vnode, container);
    } else if (nextFlag === VNODE_TYPE.TEXT) {
        patchText(oldVnode, vnode);
    }
}

function patchElement (oldVnode, vnode, container) {
    if (oldVnode.tag !== vnode.tag) {
        replaceVnode(oldVnode, vnode, container);
        return
    }

    updateData(oldVnode, vnode);

    patchChildren(oldVnode, vnode, container)
}

function patchChildren(oldVnode, vnode, container){
    let el = (vnode.el = oldVnode.el);
    let prevChildFlag = oldVnode.childrenFlag;
    let childFlag = vnode.childrenFlag;
    let prevChildren = oldVnode.children;
    let children = vnode.children;

    switch (prevChildFlag) {
        case CHILDREN_VNODE_TYPE.EMPTY:
            switch(childFlag){
                case CHILDREN_VNODE_TYPE.EMPTY:
                    break;

                case CHILDREN_VNODE_TYPE.SINGLE:
                    mount(children, el);
                    break;

                case CHILDREN_VNODE_TYPE.MUTIPLE:
                    for(let i=0; i<children.length; i++){
                        mount(children[i], el)
                    }
                    break;
            }
            break;

        case CHILDREN_VNODE_TYPE.SINGLE:
            switch(childFlag){
                case CHILDREN_VNODE_TYPE.EMPTY:
                    el.removeChild(prevChildren.el);
                    break;

                case CHILDREN_VNODE_TYPE.SINGLE:
                    patch(prevChildren, children, el);
                    break;

                case CHILDREN_VNODE_TYPE.MUTIPLE:
                    el.removeChild(prevChildren.el);
                    for(let i=0; i<children.length; i++){
                        mount(children[i], el)
                    }
                    break;
            }
            break;

        case CHILDREN_VNODE_TYPE.MUTIPLE:
            switch(childFlag){
                case CHILDREN_VNODE_TYPE.EMPTY:
                    for(let i = 0; i<prevChildren.length; i++){
                        el.removeChild(prevChildren[i].el)
                    }
                    break;

                case CHILDREN_VNODE_TYPE.SINGLE:
                    for(let i = 0; i<prevChildren.length; i++){
                        el.removeChild(prevChildren[i].el)
                    }
                    mount(children, el);
                    break;

                case CHILDREN_VNODE_TYPE.MUTIPLE:

                    let lastIndex = 0;
                    for(let i = 0; i < children.length; i++) {
                        let find = false;
                        let nextVnode = children[i];

                        for(let j=0; j < prevChildren.length; j++){
                            let prevVnode = prevChildren[j];
                            if (prevVnode.key && prevVnode.key === nextVnode.key) {
                                find = true;
                                patch(prevVnode, nextVnode, el);
                                if(j < lastIndex) {
                                    //需要移动
                                    let flagNode = children[i-1].el.nextSibling;
                                    el.insertBefore(prevVnode.el, flagNode);
                                } else {
                                    lastIndex = j;
                                }
                            }
                        }

                        //若旧元素中没有相同的key，表示需要新增
                        if (!find) {
                            let flagNode;
                            if (i===0) {
                                flagNode = prevChildren[0].el;
                            } else {
                                flagNode = children[i-1].el.nextSibling
                            }
                            mount(nextVnode, el, flagNode);
                        }
                    }

                    //删除新元素中没有出现的旧元素
                    for(let i=0; i<prevChildren.length; i++) {
                        if(!children.find(vnode => vnode.key === prevChildren[i].key)){
                            el.removeChild(prevChildren[i].el);
                        }
                    }
                    break;
            }
            break;
    }
}

/*更新data属性*/
function updateData(oldVnode, vnode){
    let el = (vnode.el = oldVnode.el);
    let prevData = oldVnode.data;
    let data = vnode.data;

    if (data) {
        for(let key in data) {
            patchData(el, key, prevData[key], data[key]);
        }
    }
    /*需要删除掉旧的data中，新data没有的属性*/
    if (prevData) {
        for(let key in prevData) {
            if(prevData[key] && !data.hasOwnProperty(key)) {
                patchData(el, key, prevData[key], null);
            }

        }
    }
}

/*
* 更新文本节点类型
* 直接将vnode的el指向旧的el，并修改el的nodeValue即可
* */
function patchText(oldVnode, vnode){
    if (oldVnode.children === vnode.children) {
        return;
    }

    let el = (vnode.el = oldVnode.el);
    el.nodeValue = vnode.children;
}

/*
* 直接替换掉旧的节点，重新挂载新节点
* */
function replaceVnode(oldVnode, vnode, container) {
    container.removeChild(oldVnode.el);

    mount(vnode, container);
}



//首次挂载元素
function mount(vnode, container, flagNode) {
    let {flag} = vnode;
    if (flag === VNODE_TYPE.HTML) {
        mountElement(vnode, container, flagNode);
    } else if (flag === VNODE_TYPE.TEXT) {
        mountText(vnode, container);
    }
}

/*挂载标签元素节点*/
function mountElement(vnode, container, flagNode) {
    let dom = document.createElement(vnode.tag);
    vnode.el = dom;
    let {data, children, childrenFlag} = vnode;

    //挂载data属性到dom上
    for (let key in data) {
        patchData(dom, key, null, data[key]);
    }

    if (childrenFlag === CHILDREN_VNODE_TYPE.SINGLE) {
        mount(children, dom);
    } else if (childrenFlag === CHILDREN_VNODE_TYPE.MUTIPLE) {
        for (let i = 0; i < children.length; i++) {
            mount(children[i], dom);
        }
    }

    if (flagNode) {
        container.insertBefore(dom, flagNode);
        return;
    }
    container.appendChild(dom);
}

/*挂载文本类型节点,文本类型节点的vnode的text在vnode.children中*/
function mountText(vnode, container) {
    let dom = document.createTextNode(vnode.children);
    vnode.el = dom;
    container.appendChild(dom);
}

/*
* 挂载data属性到dom上
* @params: el - dom对象
*          key - 属性
*          prev - 旧值
*          next - 新值
* */
function patchData(el, key, prev, value) {
    switch(key) {
        case "style":
            for(let k in value) {
                el.style[k] = value[k];
            }

            /*删除掉新data中没有的属性*/
            for(let k in prev) {
                if (value && !value.hasOwnProperty(k)) {
                    el.style[key] = '';
                }
            }
            break;
        case "class":
            el.className = value;
            break;
        default:
            if (key[0] === '@') {
                let eventName = key.slice(1);
                if (prev) {
                    el.removeEventListener(eventName, prev)
                }
                el.addEventListener(eventName, value);
            }else{
                el.setAttribute(key, value);
            }
            break;
    }
}