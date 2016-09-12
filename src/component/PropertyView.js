/**
 * 属性面板
 */

import React from 'react';
import ReactDOM from 'react-dom';

import { Form, Input, InputNumber, Slider, Switch, Collapse,Select } from 'antd';
const Panel = Collapse.Panel;
import cls from 'classnames';

import WidgetStore from '../stores/WidgetStore';
import WidgetActions from '../actions/WidgetActions';

import {propertyType, propertyMap} from './PropertyMap';

require("jscolor/jscolor");

function getInputBox(type, defaultProp) {
    switch (type) {
        case propertyType.Integer:
            return <InputNumber {...defaultProp} />;

        case propertyType.Number:
            return <InputNumber step={0.1} {...defaultProp} />;

        case propertyType.Percentage:
            return  <div>
                <InputNumber step={0.1} max={100} min={0} defaultValue={100}  className='slider-input' />
                <Slider max={1} step={0.001} {...defaultProp}  className='slider-per' />
            </div>;

        case propertyType.Text:
            return <Input type="textarea" {...defaultProp} />;

        case propertyType.Color:
            return <Input ref={(input) => {
                if (input) {
                    var dom = ReactDOM.findDOMNode(input).firstChild;
                    if (!dom.jscolor) {
                        dom.jscolor = new window.jscolor(dom, {hash:true, required:false});
                        dom.jscolor.onFineChange = defaultProp.onChange;
                    }
                }
            }} {...defaultProp} />;

        case propertyType.Boolean:
            return <Switch {...defaultProp} />;

        case propertyType.Select:
            return  <Select   {...defaultProp}   >
                {defaultProp.options}
            </Select>;

        default:
            return <Input {...defaultProp} />;
    }
}

class PropertyView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {fields: null};
        this.selectNode = null;
        this.currentPage = null;
    }

    onChangeProp(prop, value) {
        let v;
        if (value === undefined) {
            v = null;
        } else {
            switch (prop.type) {
                case propertyType.Percentage:
                    v = parseFloat(value);
                    if (v === prop.default)
                        v = null;
                    break;

                case propertyType.Number:
                    v = parseFloat(value);
                    break;

                case propertyType.Integer:
                    v = parseInt(value);
                    break;

                case propertyType.Boolean:
                    v = (value === prop.default) ? null : value;
                    break;

                default:
                    v = value;
            }
        }
        const obj = {};
        obj[prop.name] = v;
        this.onStatusChange({updateProperties: obj});

        WidgetActions['updateProperties'](obj, false, true);
    }

    onChangePropDom(item, value) {
        this.onChangeProp(item, (value && value.target.value !== '') ? value.target.value : undefined);
    }



    antLockEvent(event) {

    }



    getFields() {
        let node = this.selectNode;

        if (!node)
            return null;

        let className = node.className;
        if (className.charAt(0) == '_')
            className = 'class';

        if (!propertyMap[className])
            return null;

        const formItemLayout = {
            labelCol: { span: 8 },
            wrapperCol: { span: 16 }
        };

        const groups = {};


        const getInput = (item, index) => {
            let defaultValue;
            if (item.readOnly) {
                defaultValue = node.node[item.name];
            } else {
                if (node.props[item.name] === undefined)
                    defaultValue = (item.type === propertyType.Boolean || item.type === propertyType.Percentage) ? item.default : '';
                else
                    defaultValue = node.props[item.name];
            }

            const defaultProp = {
                size: 'small',
                placeholder: item.default,
                disabled: item.readOnly !== undefined,
                onChange: (item.type === propertyType.String || item.type === propertyType.Text || item.type === propertyType.Color ) ? this.onChangePropDom.bind(this, item) : this.onChangeProp.bind(this, item)
            };
            if (item.type === propertyType.Boolean) {
                defaultProp.checked = defaultValue;
            }else if(item.type ==propertyType.Select ){
               defaultProp.defaultValue=item.default;
                defaultProp.options=  item.options.map((ele,index)=><Option key={index}>{ele}</Option>);
            } else {
                defaultProp.value = defaultValue;
            }


            let groupName = item.group || 'basic';
            if (groups[groupName] === undefined)
                groups[groupName] = [];

            let hasTwin = ['x','y','w','h','rotationImgTag','originPosImgTag'].indexOf(item.showName) >= 0;//左右结构显示

            let hasPx=['x','y','w','h'].indexOf(item.showName)>=0; //判断input中是否添加px单位
            let hasDegree =['rotationImgTag'].indexOf(item.showName)>=0; //判断input中是否添加°单位
            let hasLock=item.showLock==true; //判断是否在元素前添加锁图标




            let htmlStr;

            if(item.imgClassName){
                htmlStr=<label><div className={item.imgClassName}></div></label>
            }else{
                if(hasLock){
                    htmlStr=<label><div className='ant-lock'  ></div>{item.showName}</label>
                }else {
                    htmlStr =<label>{item.showName}</label>
                }
            }


            groups[groupName].push(
                <div key={item.name}
                    className={cls('f--hlc','ant-row','ant-form-item',
                        {'ant-form-half': hasTwin}, {'ant-form-full': !hasTwin})}>

                    <div className='ant-col-l ant-form-item-label'>{htmlStr}</div>

                    <div className='ant-col-r'>
                        <div className= {cls('ant-form-item-control', {'ant-input-degree':hasDegree}, {'ant-input-px': hasPx})}>
                        {getInputBox(item.type, defaultProp, item.readOnly !== undefined)}
                        </div>
                    </div>
                </div>
            );

        };
        

        const result = [];

        propertyMap[className].forEach((item, index) => {
            if (item.isProperty)
                getInput(item, index);
        });

        return Object.keys(groups).map((name,index)=> 
                <Form horizontal key={index}>
                    {groups[name].map((input, i) => input)}
                </Form>);
    }

    onStatusChange(widget) {
        if (widget.selectWidget !== undefined){
            this.selectNode = widget.selectWidget;
            this.setState({fields: this.getFields()});
            let node = this.selectNode;
            while (node != null) {
                if (node.className == 'page') {
                    if (node != this.currentPage) {
                        this.currentPage = node;
                        node.parent.node['gotoPage'](node.node);
                    }
                    break;
                }
                node = node.parent;
            }
        } else if (widget.updateProperties !== undefined && widget.skipProperty === undefined) {
            let needRender = (widget.skipRender === undefined);
            let selectNode = this.selectNode;
            let obj = widget.updateProperties;
            let className = selectNode.className;
            if (className.charAt(0) == '_')
                className = 'class';
            propertyMap[className].map(item => {
                if (item.isProperty && obj[item.name] !== undefined) {
                    if (obj[item.name] === null) {
                        delete(selectNode.props[item.name]);
                        if (needRender)
                            selectNode.node[item.name] = item.default;
                    } else {
                        selectNode.props[item.name] = obj[item.name];
                        if (needRender)
                            selectNode.node[item.name] = obj[item.name];

                    }
                }
            });
            if (needRender)
                WidgetActions['render']();
            this.setState({fields: this.getFields()});
        }
    }

    componentDidMount() {
        this.unsubscribe = WidgetStore.listen(this.onStatusChange.bind(this));
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    render() {
        return (
            <div id='PropertyView'>
                <h1 id='PropertyViewHeader'>属性</h1>
                <div id='PropertyViewBody'>
                    {this.state.fields}
                </div>
            </div>
        );
    }
}

module.exports = PropertyView;
