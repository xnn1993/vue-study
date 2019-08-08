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

    //首次渲染
    mount(vnode, container);
}

//首次挂载元素
function mount(vnode, container) {
    let {flag} = vnode;
    if (flag === VNODE_TYPE.HTML) {
        mountElement(vnode, container);
    } else if (flag === VNODE_TYPE.TEXT) {
        mountText(vnode, container);
    }
}

/*挂载标签元素节点*/
function mountElement(vnode, container) {
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
            break;
        case "class":
            el.className = value;
            break;
        default:
            if (key[0] === '@') {
                el.addEventListener(key.slice(1), value);
            }else{
                el.setAttribute(key, value);
            }
            break;
    }
}