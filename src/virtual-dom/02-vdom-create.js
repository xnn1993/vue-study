/*
* @file vdom的创建
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
        flag, //vnode类型
        tag, //标签，文本标签没有tag，组件就是函数
        data,
        children,
        childrenFlag //标记子节点类型
    }
}

/*渲染虚拟DOM*/
function render() {

}