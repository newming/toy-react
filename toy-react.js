const RENDER_TO_DOM = Symbol('render to dom')

class ElementWrapper {
  constructor (type) {
    this.root = document.createElement(type)
  }
  setAttribute (name, value) {
    // 以on开头的识别出来，绑定事件
    if (name.match(/^on([\s\S]+)$/)) {
      // 首字母小写
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    } else {
      if (name === 'className') {
        this.root.setAttribute('class', value)
      } else {
        this.root.setAttribute(name, value)
      }
    }
  }
  appendChild (component) {
    let range = document.createRange()
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length)
    component[RENDER_TO_DOM](range)
  }
  [RENDER_TO_DOM] (range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

class TextWrapper {
  constructor (content) {
    this.root = document.createTextNode(content)
  }
  [RENDER_TO_DOM] (range) {
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Range/deleteContents
    range.deleteContents()
    range.insertNode(this.root)
  }
}

export class Component {
  constructor () {
    this.props = Object.create(null)
    this.children = []
    this._root = null
    this._range = null
  }
  setAttribute (name, value) {
    this.props[name] = value
  }
  appendChild (component) {
    this.children.push(component)
  }

  [RENDER_TO_DOM] (range) {
    this._range = range
    this.render()[RENDER_TO_DOM](range)
  }

  rerender () {
    let oldRange = this._range

    let range = document.createRange()
    range.setStart(oldRange.startContainer, oldRange.startOffset)
    range.setEnd(oldRange.startContainer, oldRange.startOffset)
    this[RENDER_TO_DOM](range)

    oldRange.setStart(range.endContainer, range.endOffset)
    oldRange.deleteContents()

    // 直接 deleteContents 后进行render 会出现range覆盖问题，所以修改为上边写法，先插入在删除
    // this._range.deleteContents()
    // this[RENDER_TO_DOM](this._range)
  }

  setState (newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState
      this.rerender()
      return
    }
    let merge = function (oldState, newState) {
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p]
        } else {
          merge(oldState[p], newState[p])
        }
      }
    }
    merge(this.state, newState)
    this.rerender()
  }

  // get root () {
  //   if (!this._root) {
  //     this._root = this.render().root // 调用 render，render实际会被编译为 createElement，所以这里会有一个递归调用，最终都会转为 ElementWrapper || TextWrapper
  //   }
  //   return this._root
  // }
}

export function createElement(type, attributes, ...children) {
  let e
  if (typeof type === 'string') {
    e = new ElementWrapper(type)
  } else {
    e = new type
  }

  for (let p in attributes) {
    e.setAttribute(p, attributes[p])
  }

  let insertChildren = (children) => {
    for (let child of children) {
      if (typeof child === 'string') {
        child = new TextWrapper(child)
      }
      if (child === null) {
        continue
      }
      // 比如 render 中调用 {this.children}
      if (typeof child === 'object' && child instanceof Array) {
        insertChildren(child)
      } else {
        e.appendChild(child)
      }
    }
  }
  insertChildren(children)

  return e
}

export function render (component, parentElement) {
  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  range.deleteContents()
  component[RENDER_TO_DOM](range)
}