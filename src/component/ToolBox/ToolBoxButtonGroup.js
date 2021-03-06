import React,{PropTypes, Component} from 'react';
import ToolBoxButton from './ToolBoxButton';
import cls from 'classnames';

import ToolBoxAction from '../../actions/ToolBoxAction';
import ToolBoxStore from '../../stores/ToolBoxStore';

// 工具栏的按钮组（包含多个工具按钮）
class ToolBoxButtonGroup extends Component {
    constructor (props) {
        super(props);
        this.state = {
            secondaryMenuVisible: false
        };
    }

    componentDidMount() {
        this.unsubscribe = ToolBoxStore.listen(this.onStatusChange.bind(this));
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    onStatusChange(store) {
        let status = store.openSecondaryId === this.props.gid;
        if(status===this.state.secondaryMenuVisible) return;
        this.setState({
            secondaryMenuVisible: status
        });
    }

    render() {
        // 是否存在次级菜单
        let hasSecondaryMenu = this.props.secondary instanceof Array && this.props.secondary.length > 1;

        return (
            <div className={ cls('ToolBoxButtonGroup', {'hasSecondaryMenu': hasSecondaryMenu}, {'hidden':this.props.hidden}) }>
                <ToolBoxButton
                    level={1}
                    isPrimary={true}
                    expanded={this.props.expanded}
                    gid={this.props.gid}
                    {...this.props.secondary[this.props.primary]}/>
                {
                    !hasSecondaryMenu ? null :
                        <div className={cls('ToolBoxButtonSubGroup', {'visible': this.state.secondaryMenuVisible})}>
                        {
                            this.props.secondary.map((item, index)=>
                                <ToolBoxButton
                                    level={2}
                                    key={index}
                                    expanded={this.props.expanded}
                                    isPrimary={index===this.props.primary}
                                    gid={this.props.gid}
                                    {...item} />)
                        }
                        </div>
                }
            </div>
        );
    }
}

ToolBoxButtonGroup.propTypes = {
    name: PropTypes.string,
    gid: PropTypes.number.isRequired,
    primary: PropTypes.number,
    secondary: PropTypes.array
};

module.exports = ToolBoxButtonGroup;
