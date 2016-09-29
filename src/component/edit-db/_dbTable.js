//数据库表格
import React from 'react';
import $class from 'classnames';

import WidgetActions from '../../actions/WidgetActions';
import WidgetStore from '../../stores/WidgetStore';

class DbTable extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            dbList : [],
            dbHeader: []
        };

    }

    componentDidMount() {
        this.unsubscribe = WidgetStore.listen(this.onStatusChange.bind(this));
        this.onStatusChange(WidgetStore.getStore());
        //ids.db.find({}, function(err, data) {
        //    console.log(data);
        //});
        //WidgetActions['ajaxSend'](null, 'POST', "http://play.vt.vxplo.cn/editor3/dbFind/57ea32507f8472077f7384f1", null, null, function(text) {
        //    let result = JSON.parse(text);
        //    if(result.d.length > 0){
        //        let dbHeader = [];
        //        for(let i in result.d[0]){
        //            if (i != "_id"){
        //                dbHeader.push(i);
        //            }
        //        }
        //        this.setState({
        //            dbHeader : dbHeader,
        //            dbList : result.d
        //        })
        //    }
        //}.bind(this));
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    onStatusChange(widget) {
        if(widget.selectWidget){
           if(widget.selectWidget.className == "db"){
               let data = widget.selectWidget.node.dbid;
               WidgetActions['ajaxSend'](null, 'POST', "http://play.vt.vxplo.cn/editor3/dbFind/"+ data , null, null, function(text) {
                   let result = JSON.parse(text);
                   if(result.d.length > 0){
                       let dbHeader = [];
                       for(let i in result.d[0]){
                           if (i != "_id"){
                               dbHeader.push(i);
                           }
                       }
                       this.setState({
                           dbHeader : dbHeader,
                           dbList : result.d
                       })
                   }
               }.bind(this));
           }
        }
    }

    render() {
        let width = this.props.isBig ? 769 : 928;

        return (
            <div className='DbTable'>
                <div className="DT-header f--h">
                    <p className="flex-1">列表</p>
                    <div className="btn-group">
                        <button className="btn btn-clear">导入</button>
                        <button className="btn btn-clear">导出</button>
                    </div>
                </div>

                <div className="DT-main">
                    <div className="DT-scroll">
                        <div className="DT-content" style={{ width : width }}>
                            <table>
                                <thead>
                                    <tr>
                                        <td></td>

                                        {
                                            this.state.dbList.length > 0
                                            ? this.state.dbHeader.map((v,i)=>{
                                                return <td key={i}>{v}</td>
                                              })
                                            : null
                                        }
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        this.state.dbList.length > 0
                                            ? this.state.dbList.map((v,i)=>{
                                                    return  <tr key={i}>
                                                                <td>{ i }</td>
                                                                {
                                                                    this.state.dbHeader.map((v2,i2)=>{
                                                                        return <td key={ i2 }>{ v[v2] }</td>
                                                                    })
                                                                }
                                                            </tr>
                                                })
                                            : null
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="add-btn f--s">
                        <button className="btn btn-clear">
                            <span className="icon" />
                            添加
                        </button>

                        <div className="flex-1"></div>
                    </div>

                    <div className="scroll-div f--h">
                        <span className="icon"/>
                        <span className="scroll flex-1 f--hlc">
                            <span />
                        </span>
                    </div>
                </div>

                <div className="DT-footer f--h">
                    <div className="left flex-1 f--hlc ">
                        <div className="account">总数： 100</div>
                        <div className="page">共 10 页</div>
                        <button className="btn btn-clear last-btn">上一页</button>
                        <div className="now-page">当前页： 1</div>
                        <button className="btn btn-clear next-bnt">下一页</button>
                    </div>

                    <div className="right f--hlc">
                        <button className="btn btn-clear cancel-btn" onClick={ this.props.editDbHide }>取消</button>
                        <button className="btn btn-clear save-btn">保存</button>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = DbTable;




