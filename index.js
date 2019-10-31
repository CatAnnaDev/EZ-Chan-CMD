module.exports = function csc(dispatch) {
let czone = null;
let chanx = null;
dispatch.hook('S_LOAD_TOPO', 3, (event) => {   		
czone = event.zone
})
dispatch.hook('S_CURRENT_CHANNEL', 2, (event) => {   		
chanx = event.channel
})
dispatch.command.add('ch', (chan) => {
dispatch.command.message(`Moving to channel ${chan}`)
dispatch.toServer('C_SELECT_CHANNEL', 1, {
unk: 1,
zone: czone,
channel: parseInt(chan) - 1
})})
dispatch.command.add('chx', () => {
dispatch.command.message(`Moving to next channel`)
dispatch.toServer('C_SELECT_CHANNEL', 1, {
unk: 1,
zone: czone,
channel: chanx
})})}