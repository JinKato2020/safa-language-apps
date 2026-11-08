// Interactive test of the real SettingsScreen; includes seven-tap unlocking and blur.
const path=require('path'),{spawnSync}=require('child_process');
const result=spawnSync(process.execPath,[path.join(__dirname,'verify_learning_ui.cjs'),process.argv[2]||'.work-settings','--settings-gate'],{stdio:'inherit'});
if(result.error)throw result.error;process.exitCode=result.status??1;
