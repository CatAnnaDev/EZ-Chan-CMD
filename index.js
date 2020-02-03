String.prototype.clr = function(hexColor) { return `<font color='#${hexColor}'>${this}</font>` ;};

module.exports = function EZChanCmd(mod) {

	let maxDistance = 5000,		// Distance at which quick-load will always ignore loading screens
	longTele = true,		// Enables quick-load for long teleports beyond maxDistance
	longTeleHoldMs = 500	// Hold duration to prevent falling through the map - Depends on your disk speed

	const channels = {'2': 1, '3': 1, '5': 3, '13': 8, '7001': 7, '7002': 3, '7003': 5, '7004': 4, '7005': 10, '7011': 7, '7012': 5, '7013': 1, '7014': 5, '7015': 7, '7021': 3, '7022': 3, '7023': 4, '7031': 3, '8001': 1};

	let hooks = [],
		sCurrentChannel = null,
		seconds = 0,
		sSpawnMe = null,
		cOne = -1,
		cTwo = -1,
		zone = -1,
		serverQuick = false,
		modifying = false,
		myPos = null,
		spawnLoc = null,
		enabled = true;

		mod.hook('S_LOGIN', 'raw', () => {
			zone = -1
			myPos = null
		})

	mod.game.on('enter_game', () => {
			load();
	});

	mod.command.add('ql', () => {
		enabled = !enabled
		mod.command.message('Quick Load is ' + (enabled ? 'enabled' : 'disabled'))
	})

	mod.game.on('leave_game', () => { unload(); });
	
	mod.command.add(['c', 'ch', 'channel', 'ㅊ'], (a, co, ct) => {
		let c = sCurrentChannel.channel,
			//m = channels[mod.game.me.zone],
			m = 20, // lazy
			t = null;
		if (mod.game.me.inBattleground || mod.game.me.inCombat || m === 1 || sCurrentChannel.type !== 1 || c > 20)
			msg(`${mod.game.me.inBattleground ? 'You are in a battleground' : mod.game.me.inCombat ? 'You are in combat' : c > 10 ? 'You are in an instance' : m === 1 ? 'There is only one channel' : t !== 1 ? 'You are restricted from switching channels' : 'null'}.`.clr('FF0000'));
		else {
			switch (a ? a.toLowerCase() : a) {
				case undefined:
				case 'n':
				case 'next':
					t = (c === m) ? 1 : (c + 1);
					break;
				case 'b':
				case 'back':
					t = (c === 1) ? m : (c - 1);
					break;
				case 's':
				case 'set':
					if(co && ct && co > 0 && ct > 0 && co <= m && ct <= m && co != ct){
						cOne = co;
						cTwo = ct;
						msg(`C1 = ${cOne}, C2 = ${cTwo}`.clr('00FF33'));
						return;
					} else{
						msg(`${m === 1 ? 'There is only one channel' : 'Invalid arguments. Type: c s ChannelOne ChannelTwo'}.`.clr('FF0000'));
						return;
					}
				case 't':
				case 'toggle':
					if(c == cOne) t = cTwo;
					else t = cOne;
					break;
				default:
					if (isNaN(a) || (a < 1 && m !== 20) || (a > m) || a === c.toString())
						msg(`${(isNaN(a) || (a < 1 && m !== 20)) ? a + ' is an invalid parameter' : (a > m) ? a + ' exceeds the maximum number of channels (' + m + ')' : a === c.toString() ? 'You are already on this channel' : 'null'}.`.clr('FF0000'));
					else
						t = (a === 0) ? 20 : a;
			}
			if (t && t <= m && t > 0) {
				mod.send('C_SELECT_CHANNEL', 1, {
					unk: 1,
					zone: mod.game.me.zone,
					channel: (t - 1)
				});
				msg(`Switching to channel ${t} of ${m}.`.clr('00FF33'));
			} else {
				msg(`${t} is an invalid channel. Type: c s ChannelOne ChannelTwo to set proper channels'`.clr('FF0000'));
			}
		}
	});

	mod.hook('S_CURRENT_CHANNEL', 2, ({channel, type}) => { sCurrentChannel = {channel: channel, type: type}; });

	function hook() { hooks.push(mod.hook(...arguments)); }

	function load() {
		if (!hooks.length) {

			hook('S_PREPARE_SELECT_CHANNEL', 1, () => { seconds = 0; });

			hook('S_CANCEL_SELECT_CHANNEL', 1, () => { unk = 0; });

			hook('S_LOAD_TOPO', 3, {order: 100}, (event) => {
				if(seconds)
					return event.quick = true;
					seconds = 0;
			});

			hook('S_SPAWN_ME', 3, {order: 100}, (event) => {
				sSpawnMe = event;

				if(seconds) {
					seconds = 0;
					mod.send('S_SPAWN_ME', 3, (event));
					mod.send('C_PLAYER_LOCATION', 5, {
						loc: event.loc,
						w: event.w,
						lookDirection: 0,
						dest: event.loc,
						type: 7,
						jumpDistance: 0,
						inShuttle: 0,
						time: 0
					});
				}
			});

			hook('C_PLAYER_LOCATION', 5, (event) => {
				if(sSpawnMe) {
					if(event.loc.z !== sSpawnMe.loc.z) {
						mod.send('S_INSTANT_MOVE', 3, {
							gameId: mod.game.me.gameId,
							loc: sSpawnMe.loc,
							w: sSpawnMe.w
						});
						sSpawnMe = null;
						return false;
					}
					sSpawnMe = null;
				}
			});
		}
	}

	mod.hook('S_LOAD_TOPO', 3, {order: 100}, event => {
		if(!enabled) return
		serverQuick = event.quick
		if(event.zone === zone && (longTele || myPos.dist3D(event.loc) <= maxDistance))
			return event.quick = modifying = true

		myPos = event.loc
		zone = event.zone
		modifying = false
	})

	mod.hook('S_SPAWN_ME', 3, {order: 100}, event => {
		if(!serverQuick) spawnLoc = event

		if(modifying) {
			if(!myPos || myPos.dist3D(event.loc) > maxDistance)
				process.nextTick(() => { mod.send('S_ADMIN_HOLD_CHARACTER', 2, {hold: true}) })
			else modifying = false

			mod.send('S_SPAWN_ME', 3, event) // Bring our character model back from the void
			mod.send('C_PLAYER_LOCATION', 5, { // Update our position on the server
				loc: event.loc,
				dest: event.loc,
				type: 7
			})
		}
	})

	mod.hook('S_ADMIN_HOLD_CHARACTER', 'raw', () => !modifying && undefined)

	mod.hook('C_PLAYER_LOCATION', 5, event => {
		if(spawnLoc) {
			// Did we accidentally spawn under the map? Let's fix that!
			if(event.loc.z !== spawnLoc.loc.z) {
				mod.send('S_INSTANT_MOVE', 3, spawnLoc)
				spawnLoc = null
				return false
			}
			spawnLoc = null
		}
	})

	mod.hook('C_PLAYER_LOCATION', 5, {order: 100, filter: {fake: null}}, event => { myPos = event.loc })

	mod.hook('C_VISIT_NEW_SECTION', 'raw', () => {
		// If our client doesn't send C_PLAYER_LOCATION before this packet, then it's most likely user input
		spawnLoc = null

		if(modifying) {
			mod.setTimeout(() => { mod.send('S_ADMIN_HOLD_CHARACTER', 2, {hold: false}) }, longTeleHoldMs)
			modifying = false
		}
	})


	function unload() {
		if (hooks.length) {
			for (let i of hooks)
				mod.unhook(i);
			hooks = [];
		}
	}

	function msg(event) { mod.command.message(event); }

	this.destructor = () => { mod.command.remove(['c', 'ch', 'channel', 'ㅊ', 'ql']); };
};
