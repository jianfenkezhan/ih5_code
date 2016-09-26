import Reflux from 'reflux';
import WidgetActions from '../actions/WidgetActions';

var bridge = require('bridge');
bridge.create();
var globalToken;

var rootDiv;
var rootElm;

var stageTree;
var classList;
let _keyCount = 1;


var prevObj;
var prevNewObj;
var dragTag;


var copyObj = {};

function isEmptyString( str ){
    if ( str == "" ) return true;
    var regu = "^[ ]+$";
    var re = new RegExp(regu);
    return re.test(str);
}

//json对象浅克隆
function cpJson(a){return JSON.parse(JSON.stringify(a))}

function onSelect() {
  WidgetActions['selectWidget'](this);
}

const selectableClass = ['image', 'imagelist', 'text', 'video', 'rect', 'ellipse', 'path', 'slidetimer', 'bitmaptext', 'qrcode', 'counter', 'button', 'taparea'];
var currentLoading;

function loadTree(parent, node) {
  let current = {};
  current.parent = parent;
  current.key = _keyCount++;
  current.className = node['cls'];
  current.props = node['props'] || {};
  current.events = node['events'] || {};

  current.varList = [];
  if (node['vars']) {
    for (let i = 0; i<node['vars'].length; i++) {
        let temp = {};
        temp['name'] = node['vars'][i].__name;
        temp['value'] = node['vars'][i].__value;
        temp['className'] = node['vars'][i].__className;
        temp['props'] = node['vars'][i].__props;
        temp['type'] = node['vars'][i].__type;
        temp['key'] = _keyCount++;
        temp['widget'] = current;
        current.varList.unshift(temp);
      // if (n.length >= 3 && n.substr(0, 2) == '__') {
      //     current.varList.unshift({n.substr(2) : node['vars'][n]});
      // }
    }
  }
  current.funcList = [];
  if (node['funcs']) {
    for (let i = 0; i<node['funcs'].length; i++) {
        let temp = {};
        temp['name'] = node['funcs'][i].__name;
        temp['value'] = node['funcs'][i].__value;
        temp['className'] = node['funcs'][i].__className;
        temp['props'] = node['funcs'][i].__props;
        temp['key'] = _keyCount++;
        temp['widget'] = current;
        current.funcList.unshift(temp);
    }

      // if (n.length >= 3 && n.substr(0, 2) == '__') {
      //
      // }
        // current.funcList.unshift({key:n.substr(2), value:node['funcs'][n]});
    // }
  }

  if (node['id'])
    current.props['id'] = node['id'];

  var renderer = bridge.getRenderer((parent) ? parent.node : null, node);
  current.node = bridge.addWidget(renderer, (parent) ? parent.node : null, node['cls'], null, node['props'], (parent && parent.timerWidget) ? parent.timerWidget.node : null);
  current.timerWidget = (bridge.isTimer(current.node)) ? current : ((parent && parent.timerWidget) ? parent.timerWidget : null);

  if (parent) {
    parent.children.unshift(current);
    current.rootWidget = parent.rootWidget;
    if (renderer != current.rootWidget.rendererList[0])
      current.rootWidget.rendererList.unshift(renderer);
  } else {
    current.rootWidget = current;
    current.imageList = node['links'] || [];
    current.rendererList = [renderer];
    bridge.setLinks(current.node, current.imageList);
    bridge.createSelector(current.node);
  }

  if (selectableClass.indexOf(current.className) >= 0) {
    bridge.addMouseDownHandler(current.node, onSelect.bind(current));
  }

  current.children = [];
  let children = node['children'];
  if (children) {
    for (let i = 0; i < children.length; i++) {
      loadTree(current, children[i]);
    }
  }
  return current;
}

function trimTreeNode(node, links) {
  if (node.props['link'] !== undefined)
    node.props['link'] = links.push(node.rootWidget.imageList[node.props['link']]) - 1;
  if (node.children.length > 0) {
    node.children.map(item => {
      trimTreeNode(item, links);
    });
  }
}

function trimTree(node) {
  var links = [];
  trimTreeNode(node, links);
  node.imageList = links;
  bridge.setLinks(node.node, links);
}

function saveTree(data, node) {
  data['cls'] = node.className;
  let props = {};
  for (let name in node.props) {
    if (name === 'id')
      data['id'] = node.props['id'];
    else
      props[name] = node.props[name];
  }
  if (props)
    data['props'] = props;
  if (node.events)
    data['events'] = node.events;
  if (node.varList.length > 0) {
    data['vars'] = [];
    for (let i = node.varList.length-1; i >=0 ; i--) {
        let o = {};
        o['__name'] = node.varList[i].name;
        o['__value'] = node.varList[i].value;
        o['__className'] = node.varList[i].className;
        o['__props'] = node.varList[i].props;
        o['__type'] = node.varList[i].type;
        data['vars'].push(o);
    }
    // data['vars'] = o;
  }
  if (node.funcList.length > 0) {
    data['funcs'] = [];
    for (let i = node.funcList.length-1; i >=0 ; i--) {
        var o = {};
      // o['__' + node.funcList[i].key] = node.funcList[i].key;
        o['__name'] = node.funcList[i].name;
        o['__value'] = node.funcList[i].value;
        o['__className'] = node.funcList[i].className;
        o['__props'] = node.funcList[i].props;
        data['funcs'].push(o);
    }
    // data['funcs'] = o;
  }
  if (node.children.length > 0) {
    data['children'] = [];
    node.children.map(item => {
      if (item.className == 'track' && item.props['prop'] && item.props['data'].length > 0) {
        data['props'] = data['props'] || {};
        for (var i = 0; i < item.props['prop'].length; i++) {
          data['props'][item.props['prop'][i]] = item.props['data'][0][i + 1];
        }
      }
      let child = {};
      data['children'].unshift(child);
      saveTree(child, item);
    });
  }
}

bridge.setGenerateText(function(widget, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'app/generateText');
  if (globalToken)
      xhr.setRequestHeader('Authorization', 'Bearer {' + globalToken + '}');
  var form = new FormData();
  form.append('font', widget['font']);
  form.append('text', widget['value']);
  form.append('size', widget['size']);
  form.append('color', widget['color']);
  form.append('lineHeight', widget['lineHeight']);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(e) {
    if (this.status == 200) {
      var uInt8Array = new Uint8Array(this.response);
      var i = uInt8Array.length;
      var binaryString = new Array(i);
      while (i--)
      {
        binaryString[i] = String.fromCharCode(uInt8Array[i]);
      }
      var data = binaryString.join('');
      WidgetActions['setImageText']('data:image/png;base64,' + btoa(data));
    }
  };
  xhr.send(form);
});

function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();

  var dt = e.dataTransfer;
  var files = dt.files;
  var i;
  var file;

  /*
  for (i = 0; i < files.length; i++) {
    file = files[i];
    if (file.type.match(/text\/html/)) {
      let reader = new FileReader();
      reader.onload = e => {
        let s =window.atob(e.target.result.substr(22));
        let re = /VXCORE\.load\((.*)\)\;\<\/script\>/;
        let result = re.exec(s);
        if (result[1]) {
          let o = JSON.parse(result[1]);
          if (o && o['stage']) {
            this.currentWidget = null;
            stageData = o['stage'];
            WidgetActions['initTree'](true);
          }
        }
      };
      reader.readAsDataURL(file);
      return;
    }
  }*/

  if (this.currentWidget && this.currentWidget.node['create']) {
    for (i = 0; i < files.length; i++) {
      file = files[i];
      if (file.type.match(/image.*/)) {
        let reader = new FileReader();
        reader.onload = e => {
          this.addWidget('image', null, e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }
}

/*
function downloadFile(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}
*/

export default Reflux.createStore({
    init: function () {
        this.listenTo(WidgetActions['selectWidget'], this.selectWidget);
        this.listenTo(WidgetActions['addWidget'], this.addWidget);
        this.listenTo(WidgetActions['reorderWidget'], this.reorderWidget);
        this.listenTo(WidgetActions['addClass'], this.addClass);
        this.listenTo(WidgetActions['removeWidget'], this.removeWidget);
        this.listenTo(WidgetActions['copyWidget'], this.copyWidget);
        this.listenTo(WidgetActions['pasteWidget'], this.pasteWidget);
        this.listenTo(WidgetActions['initTree'], this.initTree);
        this.listenTo(WidgetActions['render'], this.render);
        this.listenTo(WidgetActions['updateProperties'], this.updateProperties);
        this.listenTo(WidgetActions['resetTrack'], this.resetTrack);
        this.listenTo(WidgetActions['syncTrack'], this.syncTrack);
        this.listenTo(WidgetActions['deletePoint'], this.deletePoint);
        this.listenTo(WidgetActions['saveNode'], this.saveNode);
        this.listenTo(WidgetActions['setRulerLine'], this.setRulerLine);
        this.listenTo(WidgetActions['setFont'], this.setFont);
        this.listenTo(WidgetActions['setImageText'], this.setImageText);
        this.listenTo(WidgetActions['imageTextSize'], this.imageTextSize);
        this.listenTo(WidgetActions['ajaxSend'], this.ajaxSend);
        this.listenTo(WidgetActions['saveFontList'], this.saveFontList);
        this.listenTo(WidgetActions['activeHandle'], this.activeHandle);

        this.listenTo(WidgetActions['cutWidget'], this.cutWidget);
        this.listenTo(WidgetActions['lockWidget'], this.lockWidget);
        this.listenTo(WidgetActions['renameWidget'], this.renameWidget);

        this.listenTo(WidgetActions['initEventTree'], this.initEventTree);
        this.listenTo(WidgetActions['removeEventTree'], this.removeEventTree);
        this.listenTo(WidgetActions['enableEventTree'], this.enableEventTree);
        this.listenTo(WidgetActions['activeEventTree'], this.activeEventTree);
        this.listenTo(WidgetActions['addEvent'], this.addEvent);
        this.listenTo(WidgetActions['removeEvent'], this.removeEvent);
        this.listenTo(WidgetActions['enableEvent'], this.enableEvent);

        this.listenTo(WidgetActions['selectFunction'], this.selectFunction);
        this.listenTo(WidgetActions['addFunction'], this.addFunction);
        this.listenTo(WidgetActions['changeFunction'], this.changeFunction);
        this.listenTo(WidgetActions['removeFunction'], this.removeFunction);

        this.listenTo(WidgetActions['selectVariable'], this.selectVariable);
        this.listenTo(WidgetActions['addVariable'], this.addVariable);
        this.listenTo(WidgetActions['changeVariable'], this.changeVariable);
        this.listenTo(WidgetActions['removeVariable'], this.removeVariable);

        this.listenTo(WidgetActions['changeName'], this.changeName);

        this.currentActiveEventTreeKey = null;//初始化当前激活事件树的组件值
    },
    selectWidget: function(widget, shouldTrigger) {
        var render = false;
        if (widget) {
          if (!this.currentWidget || this.currentWidget.rootWidget != widget.rootWidget) {
            render = true;
            var el = bridge.getDomElement(widget.rootWidget.node);
            if (el != rootElm) {
              if (rootElm)
                rootDiv.removeChild(rootElm);
              rootElm = el;
              rootDiv.appendChild(rootElm);
            }
          }
          if(widget.props['locked'] === undefined) {
            widget.props['locked'] = false;
          }
          //取选激活的树
          if(this.currentActiveEventTreeKey!==null || this.currentActiveEventTreeKey!==undefined){
            this.activeEventTree(null);
          }
          //取选func状态
          if(this.currentFunction!==null || this.currentFunction!==undefined) {
            this.selectFunction(null);
          }
          if(this.currentVariable!==null || this.currentVariable!==undefined) {
              this.selectVariable(null);
          }
        }
        this.currentWidget = widget;
        //是否触发（为定义或者是true就触发）
        if(shouldTrigger===true||shouldTrigger===undefined) {
            this.trigger({selectWidget: widget});
            //判断是否是可选择的，是否加锁
            if (widget && selectableClass.indexOf(widget.className) >= 0 && !widget.props['locked']) {
                bridge.selectWidget(widget.node, this.updateProperties.bind(this));
            } else {
                bridge.selectWidget(widget.node);
            }
        }

        if (render)
          this.render();
    },
    addWidget: function(className, props, link) {

      if (!this.currentWidget)
          return;

      props = this.addWidgetDefaultName(className, props, true);

      if (className === 'track') {
        if (!this.currentWidget.timerWidget ||
            (this.currentWidget.className !== 'image'
              && this.currentWidget.className !== 'imagelist'
              && this.currentWidget.className !== 'text'
              && this.currentWidget.className !== 'bitmaptext'
              && this.currentWidget.className !== 'ellipse'
              && this.currentWidget.className !== 'path'
              && this.currentWidget.className !== 'qrcode'
              && this.currentWidget.className !== 'counter'
              && this.currentWidget.className !== 'rect'
              && this.currentWidget.className !== 'container'))
          return;
        let propList = ['positionX', 'positionY', 'scaleX', 'scaleY', 'rotation', 'alpha'];
        let dataList = [];   //let dataList = [[0], [1]];
        //for (let i = 0; i < propList.length; i++) {
        //  let d = this.currentWidget.node[propList[i]];
        //  dataList[0].push(d);
        //  //dataList[1].push(d);
        //}
        let track = loadTree(this.currentWidget, {'cls':className, 'props': {'prop': propList, 'data': dataList, 'name':props['name']}});
        this.trigger({redrawTree: true, updateTrack: track});
      } else if (className === 'body' || className === 'easing' || className === 'effect' || this.currentWidget.node['create']) {
        let p;
        if (props || link) {
          p = {};
          if (props) {
            for (let n in props) {
              p[n] = props[n];
            }
          }
          if (link)
            p['link'] = this.currentWidget.rootWidget.imageList.push(link) - 1;
        }
          var o = loadTree(this.currentWidget, {'cls':className, 'props': p});
          if (className == 'bitmaptext')
              currentLoading = o;
        var cmd = {redrawTree: true};
        if (className == 'body')
          cmd.updateProperties = {'originX':0.5, 'originY':0.5};
        this.trigger(cmd);
        this.render();
      }
    },

    removeWidget: function() {
        if (this.currentWidget && this.currentWidget.parent) {
            //isModified = true;
            bridge.removeWidget(this.currentWidget.node);
            let index = this.currentWidget.parent.children.indexOf(this.currentWidget);
            var rootNode = this.currentWidget.rootWidget.node;
            this.currentWidget.parent.children.splice(index, 1);
            this.currentWidget = null;
            this.trigger({selectWidget: null, redrawTree: true});
            process.nextTick(() => bridge.render(rootNode));
        }
    },
    copyWidget: function() {
      if (this.currentWidget && this.currentWidget.parent) {
        copyObj = {};
        saveTree(copyObj, this.currentWidget);
      }
    },
    pasteWidget: function() {
      if (this.currentWidget) {
        // 重命名要黏贴的widget
        let temp = cpJson(copyObj);
        temp.props = this.addWidgetDefaultName(temp.cls, temp.props, false);
        loadTree(this.currentWidget, temp);
        this.trigger({selectWidget: null, redrawTree: true});
        this.render();
      }
    },
    cutWidget: function() {
        this.copyWidget();
        this.removeWidget();
    },
    lockWidget: function () {
        if (this.currentWidget) {
            this.currentWidget.props['locked'] = !this.currentWidget.props['locked'];
            this.updateProperties({'locked':this.currentWidget.props['locked']});
            if (!this.currentWidget.props['locked']) {
                bridge.selectWidget(this.currentWidget.node, this.updateProperties.bind(this));
            } else {
                bridge.selectWidget(this.currentWidget.node);
            }
            //递归遍历加锁
            let parentLock = this.currentWidget.props['locked'];
            let loopLock = (children) => {
                for(let i=0; i<children.length; i++) {
                    children[i].props['locked'] = parentLock;
                    if(children[i].children&&children[i].children.length>0) {
                        loopLock(children[i].children);
                    }
                }
            };
            loopLock(this.currentWidget.children);

            this.trigger({redrawTree: true});
            this.render();
        }
    },
    reorderWidget: function(delta) {
      if (this.currentWidget && this.currentWidget.parent) {
          let index = this.currentWidget.parent.children.indexOf(this.currentWidget);
          if (delta > 0 && index < this.currentWidget.parent.children.length - 1 || delta < 0 && index > 0) {
            this.currentWidget.parent.children.splice(index, 1);
            this.currentWidget.parent.children.splice(index + delta, 0, this.currentWidget);
            bridge.reorderWidget(this.currentWidget.node, delta);
            this.render();
            this.trigger({redrawTree: true});
          }
      }
    },
    addWidgetDefaultName: function(className, properties, valueAsTextName) {
        if (!this.currentWidget)
            return;

        if(properties === undefined || properties === null) {
            properties = {};
        }
        let props = cpJson(properties);
        if ((className === 'text' || className === 'bitmaptext') && props.value && valueAsTextName){
            props['name'] = props.value;
        } else {
            let cOrder = 1;
            //查找当前widget有多少个相同className的，然后＋1处理名字
            for(let i = 0; i<this.currentWidget.children.length; i++){
                if(this.currentWidget.children[i].className === className){
                    cOrder+=1;
                }
            }
            props['name'] = className + cOrder;
        }
        return props;
    },
    renameWidget: function (newname) {
        this.currentWidget.props['name'] = newname;
        this.updateProperties({'name':this.currentWidget.props['name']});
        this.render();
        this.trigger({redrawTree: true});
    },
    updateProperties: function(obj, skipRender, skipProperty) {
      if(this.currentWidget.props.isLock){
          let newObj =cpJson(obj);
          if(prevObj) {
              if (prevObj.scaleX == obj.scaleX && prevObj.scaleY == obj.scaleY) {
                  //松开鼠标
                  newObj.scaleX = prevNewObj.scaleX;
                  newObj.scaleY = prevNewObj.scaleY;
                  dragTag = null;
              } else if ( prevObj.scaleY != obj.scaleY && prevObj.scaleX != obj.scaleX) {
                  //x y轴变动
                  newObj.scaleY = newObj.scaleX;
                     dragTag = 'xy';
              } else if (prevObj.scaleY == obj.scaleY && prevObj.scaleX != obj.scaleX) {
                  //x轴变动
                  newObj.scaleY = newObj.scaleX;
                  dragTag = 'x';
              } else if(prevObj.scaleX == obj.scaleX && prevObj.scaleY != obj.scaleY){
                  //y轴变动
                  if(dragTag=='x' || dragTag =='xy'){
                      //修复闪动的bug
                      newObj.scaleY = newObj.scaleX;
                  }else{
                      newObj.scaleX = newObj.scaleY;
                      dragTag = 'y';
                  }
              }
          }
          prevObj =cpJson(obj);
          obj =newObj;
          prevNewObj =cpJson(newObj);
      }

        let p = {updateProperties: obj};
        if (skipRender) {
            p.skipRender = true;
            bridge.updateSelector(this.currentWidget.node);
        }
        if (skipProperty) {
            p.skipProperty = true;
            bridge.updateSelector(this.currentWidget.node);
        }
        this.trigger(p);
    },
    initEventTree: function(className, props) {
        if (this.currentWidget) {
            this.currentWidget.props['enableEventTree'] = true;
            this.currentWidget.props['eventTree'] = [];
        }
        this.trigger({redrawTree: true});
        // this.render();
    },
    removeEventTree: function() {
        if (this.currentWidget) {
            this.currentWidget.props['eventTree'] = undefined;
            this.currentWidget.props['enableEventTree'] = undefined;
        }
        this.trigger({redrawTree: true});
        // this.render();
    },
    enableEventTree: function () {
        if (this.currentWidget) {
            this.currentWidget.props['enableEventTree'] = !this.currentWidget.props['enableEventTree'];
        }
        this.trigger({redrawTree: true});
        // this.render();
    },
    activeEventTree: function (nid) {
        //激活事件树，无则为
        if (nid!=null||nid!=undefined) {
            this.currentActiveEventTreeKey = nid;
        } else {
            this.currentActiveEventTreeKey = null;
        }
        this.trigger({activeEventTreeKey:{key:this.currentActiveEventTreeKey}});
        // this.render();
    },
    addEvent: function () {
        //TODO: 添加事件
    },
    removeEvent: function () {
        //TODO: 单个事件的删除
    },
    enableEvent: function () {
        //TODO: 单个事件的可执行开关
    },
    selectFunction: function (data) {
        if (data!=null) {
            //取消在canvas上的widget选择
            bridge.selectWidget(this.currentWidget.node);
            this.currentFunction = data;
        } else {
            this.currentFunction = null;
        }
        this.trigger({selectFunction: this.currentFunction});
        // this.render();
    },
    addFunction: function (className, param) {
        if(this.currentWidget) {
            let func = {};
            func['value'] = param.value||'';
            func['name'] = param.key||'';
            func['className']  = className;
            func['props'] = {};
            func['props']['name'] = 'func' + (this.currentWidget['funcList'].length + 1);
            func['key'] = _keyCount++;
            func['widget'] = this.currentWidget;
            this.currentWidget['funcList'].unshift(func);
        }
        this.trigger({redrawTree: true});
        // this.render();
    },
    changeFunction: function (props) {
        if(props) {
            if(props['name']) {
                this.currentFunction['name'] = props['name'];
            } else if(props['value']) {
                this.currentFunction['value'] = props['value'];
            }
        }
    },
    removeFunction: function (key) {
        if(this.currentFunction) {
            let index = -1;
            for(let i=0; i<this.currentWidget.funcList.length; i++) {
                if(this.currentFunction.widget.funcList[i].key == key) {
                    index = i;
                }
            }
            if(index>-1){
                this.currentWidget.funcList.splice(index,1);
                this.selectWidget(this.currentWidget);
            }
        }
    },
    selectVariable: function (data) {
        if (data!=null) {
            //取消在canvas上的widget选择
            bridge.selectWidget(this.currentWidget.node);
            this.currentVariable = data;
        } else {
            this.currentVariable = null;
        }
        this.trigger({selectVariable: this.currentVariable});
        // this.render();
    },
    addVariable: function (className, param) {
        if(this.currentWidget) {
            let vars = {};
            vars['value'] = param.value||null;
            vars['name'] = param.name||'';
            vars['className']  = className;
            vars['props'] = {};
            vars['type'] = param.type;
            switch (vars['type']) {
                case 'number':
                    vars['props']['name'] = 'intVar' + (this.currentWidget['varList'].length + 1);
                    break;
                case 'string':
                    vars['props']['name'] = 'strVar' + (this.currentWidget['varList'].length + 1);
                    break;
                default:
                    vars['props']['name'] = 'var' + (this.currentWidget['varList'].length + 1);
                    break;
            }
            vars['key'] = _keyCount++;
            vars['widget'] = this.currentWidget;
            this.currentWidget['varList'].unshift(vars);
        }
        this.trigger({redrawTree: true});
    },
    changeVariable: function (props) {
        if(props) {
            if(props['name']) {
                this.currentVariable['name'] = props['name'];
            } else if(props['value']) {
                this.currentVariable['value'] = props['value'];
            }
        }
    },
    removeVariable: function (key) {
        if(this.currentVariable) {
            let index = -1;
            for(let i=0; i<this.currentWidget.varList.length; i++) {
                if(this.currentVariable.widget.varList[i].key == key) {
                    index = i;
                }
            }
            if(index>-1){
                this.currentWidget.varList.splice(index,1);
                this.selectWidget(this.currentWidget);
            }
        }
    },
    changeName: function (type, name) {
        switch (type){
            case 'func':
                if(this.currentFunction&&!isEmptyString(name)){
                    this.currentFunction.props.name = name;
                    this.trigger({redrawTree: true});
                }
                break;
            case 'var':
                if(this.currentVariable&&!isEmptyString(name)) {
                    this.currentVariable.props.name = name;
                    this.trigger({redrawTree: true});
                }
                break;
            default:
                break;
        }
    },
    resetTrack: function() {
      this.trigger({resetTrack: true});
    },
    syncTrack: function() {
      this.trigger({syncTrack: true});
    },
    deletePoint: function() {
      this.trigger({deletePoint: true});
    },
    initTree: function(data) {
        //console.log(data);
        classList = [];
        bridge.resetClass();
        stageTree = [];

        if (data['defs']) {
            for (let n in data['defs']) {
                bridge.addClass(n);
                classList.push(n);
                stageTree.push({name: n, tree: loadTree(null, data['defs'][n])});
            }
        }

        stageTree.unshift({name: 'stage', tree: loadTree(null, data['stage'])});
        bridge.createSelector(null);

        if (!rootDiv) {
            rootDiv = document.getElementById('canvas-dom');
            rootDiv.addEventListener('dragenter', dragenter, false);
            rootDiv.addEventListener('dragover', dragover, false);
            rootDiv.addEventListener('drop', drop.bind(this), false);
        }

        this.trigger({initTree: stageTree, classList: classList});

        this.selectWidget(stageTree[0].tree);
    },
    addClass: function(name, bool) {
        if(bool){
            classList.unshift(name);
            stageTree.splice(
                1,
                0,
                { name: name,
                    tree: loadTree(null, { 'cls': 'root',
                        'type': bridge.getRendererType(this.currentWidget.node),
                        'props': {'width': 640, 'height': 1040}})
                }
            );
        }
        else {
            classList.push(name);
            stageTree.push(
                { name: name,
                    tree: loadTree(null, { 'cls': 'root',
                        'type': bridge.getRendererType(this.currentWidget.node),
                        'props': {'width': 640, 'height': 1040}})
                }
            );
        }

        bridge.addClass(name,bool);
        this.trigger({initTree: stageTree, classList: classList});
    },
    render: function() {
      if (this.currentWidget) {
        process.nextTick(() => bridge.render(this.currentWidget.rootWidget.node));
      }
    },
    setRulerLine:function(bIsShow){
        this.trigger({setRulerLine:{isShow:bIsShow}});
    },
    saveNode: function(wid, wname, callback) {
      // let appendArray = function(a1, a2) {
      //     for (let i = 0; i < a2.length; i++) {
      //       a1.push(a2[i]);
      //     }
      // };
      let getImageList = function(array, list) {
        var result = [];
        var count = 0;
        for (let i = 0; i < list.length; i++) {
          var item = list[i];
          if (typeof item == 'string') {
            count++;
            array.push(item);
          } else {
            var n = item.length;
            if (count) {
              result.push(count);
              count = 0;
            }
            result.push(-n);
            for (var j = 0; j < n; j++) {
              array.push(item[j]);
            }
          }
        }
        if (result.length) {
          if (count)
            result.push(count);
          return result.join(',');
        } else {
          return count;
        }
      };
      let data = {};
      let images = [];
      data['stage'] = {};
      trimTree(stageTree[0].tree);
      saveTree(data['stage'], stageTree[0].tree);
      data['stage']['type'] = bridge.getRendererType(stageTree[0].tree.node);
      // data['stage']['links'] = stageTree[0].tree.imageList.length;
      // appendArray(images, stageTree[0].tree.imageList);
      data['stage']['links'] = getImageList(images, stageTree[0].tree.imageList);

      if (stageTree.length > 1) {
        data['defs'] = {};
        for (let i = 1; i < stageTree.length; i++) {
          let name = stageTree[i].name;
          data['defs'][name] = {};
          trimTree(stageTree[i].tree);
          saveTree(data['defs'][name], stageTree[i].tree);
          data['defs'][name]['type'] = bridge.getRendererType(stageTree[i].tree.node);
          // data['defs'][name]['links'] = stageTree[i].tree.imageList.length;
          // appendArray(images, stageTree[i].tree.imageList);
          data['defs'][name]['links'] = getImageList(images, stageTree[i].tree.imageList);
        }
      }

      data = bridge.encryptData(data, images);
      if (!data)
        return;

      var cb = function(text) {
          var result = JSON.parse(text);
          callback(result['id'], wname);
      };

      if (wid) {
        this.ajaxSend(null, 'PUT', 'app/work/' + wid, 'application/octet-stream', data, cb);
      } else {
        this.ajaxSend(null, 'POST', 'app/work?name=' + encodeURIComponent(wname), 'application/octet-stream', data, cb);
      }
    },
    setFont: function(font) {
      if (this.currentWidget && this.currentWidget.className == 'bitmaptext') {
        this.updateProperties({'font':font});
      }
    },
    setImageText:function(data) {
        var current;
        if (currentLoading) {
            current = currentLoading;
            currentLoading = null;
        } else if (this.currentWidget && this.currentWidget.className == 'bitmaptext') {

            current = this.currentWidget;
            WidgetActions['imageTextSize']({
                width:current.node.width,
                height:current.node.height
            });
        }

        if (current) {
          //  isModified = true;
            var link = current.props['link'];
            if (link === undefined) {
                link = current.rootWidget.imageList.push(data) - 1;
            } else {
                current.rootWidget.imageList[link] = data;
            }
            current.props['link'] = current.node['link'] = link;
            process.nextTick(() => {
                WidgetActions['imageTextSize']({
                    width:current.node.width,
                    height:current.node.height
                });
                bridge.updateSelector(current.node);
                this.render();
            });
        }
    },
    imageTextSize:function(sizeObj){
        this.trigger({ imageTextSizeObj:sizeObj});
    },
    saveFontList:function(fontList){
        this.trigger({fontListObj:{'fontList':fontList}});
    },
    ajaxSend(token, method, url, type, data, callback, binary) {
        if (token)
          globalToken = token;
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (binary)
              callback(xhr.response);
            else
              callback(xhr.responseText);
        };
        xhr.open(method, url);
        if (binary)
          xhr.responseType = "arraybuffer";
        if (type)
            xhr.setRequestHeader('Content-Type', type);
        if (globalToken) {
            xhr.setRequestHeader('Authorization', 'Bearer {' + globalToken + '}');
        }
        xhr.send(data);
    },
    getStore: function() {
      //this.selectWidget(stageTree[0].tree);
      return {initTree: stageTree, classList: classList};
    },
    activeHandle: function(status) {
        this.trigger({hasHandle: status});
    }
});

export {globalToken}
