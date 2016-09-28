//管理数据库
import React from 'react';
import $class from 'classnames';

import WidgetActions from '../../actions/WidgetActions';
import WidgetStore from '../../stores/WidgetStore';

class ArrangeDb extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            dbList : this.props.dbList,
            error : "数据库名称未能为空",
            isError : false,
            chooseId : [],
            isDelete : false
        };
        this.createDbShow = this.createDbShow.bind(this);
        this.chooseBtn = this.chooseBtn.bind(this);
        this.topBtn = this.topBtn.bind(this);
        this.arrangeDbHide = this.arrangeDbHide.bind(this);
        this.deleteBtn = this.deleteBtn.bind(this);
        this.deleteLayerShow = this.deleteLayerShow.bind(this);
        this.deleteLayerHide = this.deleteLayerHide.bind(this);
    }

    componentDidMount() {
        this.unsubscribe = WidgetStore.listen(this.onStatusChange.bind(this));
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    onStatusChange(widget) {
        if (widget.classList !== undefined) {

        }
    }

    arrangeDbHide(){
        this.setState({
            error : "数据库名称未能为空",
            isError : false,
            chooseId : [],
            isDelete : false
        });
        this.props.arrangeDbHide();
    }

    createDbShow(){
        this.props.createDbShow();
        this.arrangeDbHide();
    }

    chooseBtn(id){
        let array = this.state.chooseId;
        let index = array.indexOf(id);
        //console.log(index);
        if( index >= 0){
            array.splice(index, 1);
        }
        else {
            array.push(id);
        }
        //console.log(array);
        this.setState({
            chooseId : array
        })
    }

    topBtn(){
        if(this.state.chooseId.length == 0){
            this.setState({
                error : "请选择数据库",
                isError : true
            })
        }
        else {

            this.setState({
                error : "数据库名称未能为空",
                isError : false,
                chooseId : []
            });
        }
    }

    deleteBtn(){
        if(this.state.chooseId.length == 0){
            this.setState({
                error : "请选择数据库",
                isError : true
            })
        }
        else {

            this.deleteLayerHide();
            this.setState({
                error : "数据库名称未能为空",
                isError : false,
                chooseId : []
            });
        }
    }

    deleteLayerShow(){
        this.setState({
            isDelete : true
        })
    }

    deleteLayerHide(){
        this.setState({
            isDelete : false
        })
    }

    render() {
        let moduleFuc = (num)=>{
            let a = 19 - num;
            let fuc = [];
            if(a >= 0){
                for(let index = 0; index < a; index++){
                    fuc[index] = index;
                }
            }
            if(a < 0){
                let b = num % 5;
                if(5-b == 0){
                    return;
                }
                else{
                    for(let index = 0; index < 5-b; index++){
                        fuc[index] = index;
                    }
                }
            }
            return fuc.map((v,i)=>{
                return <li key={i} className="not-active"> </li>
            })
        };

        return (
            <div className='ArrangeDb f--hcc'>
                <div className="AM-layer"></div>

                <div className="AM-main">
                    <div className="AM-header f--hlc">
                        <span className="icon" />
                        <span className="flex-1">数据库整理</span>
                        <span className="close-btn" onClick={ this.arrangeDbHide} />
                    </div>

                    <div className="AM-content">
                        <div className="AM-title">全部数据库：</div>

                        <div className="AM-module" >
                            <div className="AM-scroll">
                                <ul className="AM-table">
                                    {
                                        this.state.dbList.length > 0
                                            ?   this.state.dbList.map((v,i)=>{
                                                    return  <li className={ $class("f--hlc",{"active": this.state.chooseId.indexOf(v) >= 0})}
                                                                key={i}
                                                                onClick={ this.chooseBtn.bind(this, v.key)}>

                                                                <div className="flex-1 f--hlc title">
                                                                    <span className="li-icon" />
                                                                    <div className="TitleName">{v.name}</div>
                                                                </div>
                                                                <span className="choose-btn" />
                                                            </li>
                                                        })
                                            : null
                                    }
                                    <li className="add-btn f--hcc" onClick={ this.createDbShow }>
                                        <div className="icon">
                                            <span className="heng" />
                                            <span className="shu" />
                                        </div>
                                    </li>
                                    {
                                        moduleFuc(this.state.dbList.length)
                                    }
                                </ul>
                            </div>
                        </div>

                        <div className="btn-group f--hcc">
                            <button className="btn btn-clear delete-btn" onClick={ this.deleteLayerShow }>删除</button>
                            <button className="btn btn-clear top-btn" onClick={ this.topBtn } >置顶</button>
                        </div>
                    </div>

                    <div className={$class("error",{"hidden": !this.state.isError})}>{ this.state.error }</div>

                    <div className={$class("delete-layer f--hcc",{"hidden" : !this.state.isDelete })}>
                        <div className="delete-mark"></div>

                        <div className="delete-main">
                            <div className="delete-header f--hlc">
                                <span className="icon" />
                                删除
                            </div>

                            <div className="delete-content">
                                <span />

                                <p>确定删除选中的数据库？</p>

                                <div className="btn-group f--hcc">
                                    <button className="btn btn-clear delete-btn" onClick={ this.deleteBtn }>删除</button>
                                    <button className="btn btn-clear cancel-btn" onClick={ this.deleteLayerHide }>取消</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = ArrangeDb;


