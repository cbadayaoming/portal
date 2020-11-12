import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import Skeleton from '@material-ui/lab/Skeleton';
import AddIcon from '@material-ui/icons/Add';
import Divider from '@material-ui/core/Divider';
import DeleteIcon from '@material-ui/icons/Delete';
import SettingsIcon from '@material-ui/icons/Settings';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import Box from '@material-ui/core/Box';

// dashboard components
import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardBody from "components/Card/CardBody.js";
import Info from "components/Typography/Info.js";
import Snackbar from "components/Snackbar/Snackbar.js";
import Button from "components/CustomButtons/Button.js";
import Table from "components/Table/ObjectTable.js";
import IconButton from "components/CustomButtons/IconButton.js";
import RemoveDialog from "views/Instances/RemoveRuleDialog.js";
import AddDialog from "views/Instances/AddRuleDialog.js";
import ModifyDialog from "views/Instances/ModifyRuleDialog.js";
import { getGuestSecurityPolicy, moveUpGuestSecurityRule,
  moveDownGuestSecurityRule, writeLog } from "nano_api.js";

const styles = {
  cardTitleWhite: {
    color: "#FFFFFF",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none",
    "& small": {
      color: "#777",
      fontSize: "65%",
      fontWeight: "400",
      lineHeight: "1"
    }
  }
};

const useStyles = makeStyles(styles);

const i18n = {
  'en':{
    createButton: "Add New Rule",
    tableTitle: "Security Policy Rules",
    rule: 'Rule',
    action: 'Action',
    protocol: 'Protocol',
    sourceAddress: 'Source Address',
    targetPort: 'Target Port',
    default: 'Default Action',
    accept: 'Accept',
    reject: 'Reject',
    operates: "Operates",
    noResource: "No security policy available",
    modify: 'Modify',
    remove: 'Remove',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    back: 'Back',
  },
  'cn':{
    createButton: "添加新规则",
    tableTitle: "安全规则",
    rule: '规则',
    action: '处理',
    protocol: '协议',
    sourceAddress: '来源地址',
    targetPort: '目标端口',
    default: '默认处理',
    accept: '接收',
    reject: '拒绝',
    operates: "操作",
    noResource: "没有安全策略组",
    modify: '修改',
    remove: '移除',
    moveUp: '上移',
    moveDown: '下移',
    back: '返回',
  }
}

function dataToNodes(index, data, buttons){
  const operates = buttons.map((button, key) => (
    <IconButton label={button.label} icon={button.icon} onClick={button.onClick} key={key}/>
  ))
  const { action, protocol, from_address, to_port } = data;
  return [ index,  action, protocol, from_address, to_port, operates];
}

export default function SystemTemplates(props){
    const guestID = props.match.params.id;
    const { lang } = props;
    const texts = i18n[lang];
    const classes = useStyles();
    const [ mounted, setMounted ] = React.useState(false);
    const [ data, setData ] = React.useState(null);
    //for dialog
    const [ createDialogVisible, setAddDialogVisible ] = React.useState(false);
    const [ modifyDialogVisible, setModifyDialogVisible ] = React.useState(false);
    const [ deleteDialogVisible, setRemoveDialogVisible ] = React.useState(false);
    const [ selected, setSelected ] = React.useState('');

    const [ notifyColor, setNotifyColor ] = React.useState('warning');
    const [ notifyMessage, setNotifyMessage ] = React.useState("");

    const closeNotify = () => {
      setNotifyMessage("");
    }

    const showErrorMessage = React.useCallback((msg) => {
      if (!mounted){
        return;
      }
      const notifyDuration = 3000;
      setNotifyColor('warning');
      setNotifyMessage(msg);
      setTimeout(closeNotify, notifyDuration);
    }, [setNotifyColor, setNotifyMessage, mounted]);

    const reloadAllData = React.useCallback(() => {
      if (!mounted){
        return;
      }
      getGuestSecurityPolicy(guestID, setData, showErrorMessage);
    }, [guestID, showErrorMessage, mounted]);

    const showNotifyMessage = msg => {
      if (!mounted){
        return;
      }
      const notifyDuration = 3000;
      setNotifyColor('info');
      setNotifyMessage(msg);
      writeLog(msg);
      setTimeout(closeNotify, notifyDuration);
    };

    //modify
    const showModifyDialog = index =>{
      setModifyDialogVisible(true);
      setSelected(index);
    }

    const closeModifyDialog = () =>{
      setModifyDialogVisible(false);
    }

    const onModifySuccess = index =>{
      closeModifyDialog();
      showNotifyMessage(index + 'th rule modified');
      reloadAllData();
    };

    //delete
    const showRemoveDialog = index =>{
      setRemoveDialogVisible(true);
      setSelected(index);
    }

    const closeRemoveDialog = () =>{
      setRemoveDialogVisible(false);
    }

    const onRemoveSuccess = index =>{
      closeRemoveDialog();
      showNotifyMessage(index + 'the rule removed');
      reloadAllData();
    };

    //create
    const showAddDialog = () =>{
      setAddDialogVisible(true);
    };

    const closeAddDialog = () =>{
      setAddDialogVisible(false);
    }

    const onAddSuccess = templateID =>{
      closeAddDialog();
      showNotifyMessage('new security policy rule added');
      reloadAllData();
    };

    //move rule
    const moveUp = index =>{
      const onMoveUpSuccess = (id, i) =>{
        showNotifyMessage(i + 'th rule moved up');
        reloadAllData();
      }
      moveUpGuestSecurityRule(guestID, index, onMoveUpSuccess, showErrorMessage);
    }

    const moveDown = index =>{
      const onMoveDownSuccess = (id, i) =>{
        showNotifyMessage(i + 'th rule moved down');
        reloadAllData();
      }
      moveDownGuestSecurityRule(guestID, index, onMoveDownSuccess, showErrorMessage);
    }

    React.useEffect(() =>{
      setMounted(true);
      reloadAllData();
      return () =>{
        setMounted(false);
      }
    }, [reloadAllData]);

    //begin rendering
    let content;
    if (null === data){
      content = <Skeleton variant="rect" style={{height: '10rem'}}/>;
    }else{
      var rows = [[texts.default, data.default_action]];
      if (0 === data.rules.length){
        rows.push([<Box display="flex" justifyContent="center"><Info>{texts.noResource}</Info></Box>]);
      }else{
        data.rules.forEach( (rule, index) => {
          var buttons = [
            {
              onClick: e => showModifyDialog(index),
              icon: SettingsIcon,
              label: texts.modify,
            },
            {
              onClick: e => showRemoveDialog(index),
              icon: DeleteIcon,
              label: texts.remove,
            },
          ];
          if (data.rules.length - 1 !== index){
            buttons.push({
              onClick: e => moveDown(index),
              icon: ArrowDownwardIcon,
              label: texts.moveDown,
            });
          }
          if (0 !== index){
            buttons.push({
              onClick: e => moveUp(index),
              icon: ArrowUpwardIcon,
              label: texts.moveUp,
            });
          }

          rows.push(dataToNodes(index, rule, buttons));
        });
      }

      content = (
        <Table
          color="primary"
          headers={[texts.rule, texts.action, texts.protocol, texts.sourceAddress, texts.targetPort, texts.operates]}
          rows={rows}/>
      );

    }

    var buttonProps = [
      {
        href: '/admin/instances/',
        icon: NavigateBeforeIcon,
        label: texts.back,
      },
      {
        onClick: showAddDialog,
        icon: AddIcon,
        label: texts.createButton,
      },
    ];

    return (
      <GridContainer>
        <GridItem xs={12}>
          <Box mt={3} mb={3}>
          <Divider/>
          </Box>
        </GridItem>
        <GridItem xs={12} sm={12} md={12}>
          <GridContainer>
            <GridItem xs={12} sm={6} md={4}>
              <Box display="flex">
              {
                buttonProps.map( p => {
                  if (p.href){
                    return (
                      <Box p={1}>
                        <Button size="sm" color="info" round href={p.href}>
                          {React.createElement(p.icon)}{p.label}
                        </Button>
                      </Box>
                    );
                  }else{
                    return (
                      <Box p={1}>
                        <Button size="sm" color="info" round onClick={p.onClick}>
                          {React.createElement(p.icon)}{p.label}
                        </Button>
                      </Box>
                    );
                  }
                })
              }
              </Box>
            </GridItem>
          </GridContainer>
        </GridItem>
        <GridItem xs={12} sm={12} md={12}>
          <Card>
            <CardHeader color="primary">
              <h4 className={classes.cardTitleWhite}>{texts.tableTitle}</h4>
            </CardHeader>
            <CardBody>
              {content}
            </CardBody>
          </Card>
        </GridItem>
        <Snackbar
          place="tr"
          color={notifyColor}
          message={notifyMessage}
          open={"" !== notifyMessage}
          closeNotification={closeNotify}
          close
        />
        <AddDialog
          lang={lang}
          open={createDialogVisible}
          onSuccess={onAddSuccess}
          onCancel={closeAddDialog}
          />
        <ModifyDialog
          lang={lang}
          open={modifyDialogVisible}
          templateID={selected}
          onSuccess={onModifySuccess}
          onCancel={closeModifyDialog}
          />
        <RemoveDialog
          lang={lang}
          open={deleteDialogVisible}
          templateID={selected}
          onSuccess={onRemoveSuccess}
          onCancel={closeRemoveDialog}
          />
      </GridContainer>
    );
}