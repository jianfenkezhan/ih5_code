/**
 * Created by Brian on 19/10/2016.
 */

import React from 'react';
import $class from 'classnames'
import { Menu, Dropdown } from 'antd';
import { Input } from 'antd';

import WidgetStore from '../../stores/WidgetStore'
import WidgetActions from '../../actions/WidgetActions'

const inputType = {
    value: 1,
    formula: 2,
};

const MenuItem = Menu.Item;

class FormulaInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: null,
            currentType: inputType.value,
            didActiveSelectTargetMode: false,
            objectDropDownVisible: false, //对象dropdown
            propertyDropDownVisible: false, //属性dropdown
            objectList: []
        };
        this.containerId = props.containerId || 'iH5-App';
        this.minWidth = props.minWidth||'142px';
        this.onChange = props.onChange;

        this.onStatusChange = this.onStatusChange.bind(this);

        this.onActiveSelectTargetMode = this.onActiveSelectTargetMode.bind(this);
        this.onSelectTargetModeBlur = this.onSelectTargetModeBlur.bind(this);

        this.onObjectVisibleChange = this.onObjectVisibleChange.bind(this);
        this.onObjectSelect = this.onObjectSelect.bind(this);

        this.onInputTypeValueChange = this.onInputTypeValueChange.bind(this);
    }

    componentDidMount() {
        this.unsubscribe = WidgetStore.listen(this.onStatusChange);
        window.addEventListener('click', this.onSelectTargetModeBlur);
    }

    componentWillUnmount() {
        this.unsubscribe();
        window.removeEventListener('click', this.onSelectTargetModeBlur);
    }

    componentWillReceiveProps(nextProps) {
        let cType = inputType.value;
        let value = null;
        if(nextProps.value) {
            cType = nextProps.value.type;
            value = nextProps.value.value;
        }
        this.setState({
            value: value,
            currentType: cType,
            objectList: nextProps.objectList||[]
        })
    }

    onStatusChange(widget) {
        if(!widget) {
            return;
        }
        if(widget.allWidgets){
            this.setState({
                objectList: widget.allWidgets
            });
        } else if (widget.didSelectEventTarget) {
            if(widget.didSelectEventTarget.target&&this.state.didActiveSelectTargetMode) {
                let target = widget.didSelectEventTarget.target;
                let getTarget = false;
                this.state.objectList.forEach((v)=>{
                    if(target.key === v.key){
                        getTarget = true;
                    }
                });
                if (getTarget) {
                    console.log('getValueHere');
                    this.setState({
                        didActiveSelectTargetMode: false
                    }, ()=> {
                        WidgetActions['eventSelectTargetMode'](false, {formulaInput:true});
                    });
                }
            }
        }
    }

    onActiveSelectTargetMode(e) {
        e.stopPropagation();
        this.setState({
            didActiveSelectTargetMode: !this.state.didActiveSelectTargetMode,
            objectDropDownVisible: false
        }, ()=>{
            WidgetActions['eventSelectTargetMode'](this.state.didActiveSelectTargetMode, {formulaInput:true});
        });
    }

    onSelectTargetModeBlur(e) {
        if(this.state.didActiveSelectTargetMode) {
            this.setState({
                didActiveSelectTargetMode: false,
            }, ()=>{
                WidgetActions['eventSelectTargetMode'](false, {formulaInput:true});
            });
        }
    }

    onObjectVisibleChange(flag){
        this.setState({
            objectDropDownVisible: flag
        })
    }

    onObjectSelect(){

    }

    onInputTypeValueChange(e) {
        this.onChange({value:e.target.value, type:inputType.value});
    }

    render() {

        let formulaWidget = (
            <div>
                formula
            </div>
        );

        let objectMenuItem = (v1,i)=>{
            return  <MenuItem key={i} object={v1}>{v1.props.name}</MenuItem>
        };

        let objectMenu = (
            <Menu onClick={this.onObjectSelect}>
                {
                    !this.state.objectList||this.state.objectList.length==0
                        ? null
                        : this.state.objectList.map(objectMenuItem)
                }
            </Menu>
        );

        let valueWidget = (
            <div className="value-mode">
                <Dropdown overlay={objectMenu} trigger={['click']}
                          getPopupContainer={() => document.getElementById(this.containerId)}
                          onVisibleChange={this.onObjectVisibleChange}
                          visible={this.state.objectDropDownVisible}>
                    <div className={$class("formula--dropDown")}
                        style={{minWidth:this.minWidth}}>
                        <div className="formula-title f--hlc">
                            <button className={$class('formula-object-icon', {'active':this.state.didActiveSelectTargetMode})}
                                    onClick={this.onActiveSelectTargetMode}/>
                            {/*var formularInputId = 0;*/}
                            {/*fid: 'formularInput'+ formularInputId++   //标示＋控制*/}
                            <Input placeholder="比较值／对象" value={this.state.value} onChange={this.onInputTypeValueChange.bind(this)}/>
                            <span className="value-right-icon" />
                        </div>
                    </div>
                </Dropdown>
            </div>
        );

        return (
            <div className='formulaInput'>
                {
                    this.state.currentType === inputType.value
                        ? valueWidget
                        : formulaWidget
                }
            </div>
        );
    }
}

export {FormulaInput};
