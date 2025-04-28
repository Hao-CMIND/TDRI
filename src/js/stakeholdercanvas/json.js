const res = {
  nodes: {
    'e41a984d-f652-4b59-a66d-f05227d9b9b9': {
      x: 20,
      y: 241,
      title: '物流',
      avatar: 'avatarairplane.png'
    },
    '40098552-d840-4ea4-be73-a2c78043e759': {
      x: 432,
      y: 506,
      title: '採購',
      avatar: 'avatar12.png'
    },
    'ec34d009-2b96-4e1e-9f91-be1e6830f9ce': {
      x: 825,
      y: 211,
      title: 'A先生',
      avatar: 'avatar11.png'
    },
    'cb044608-36f5-4fc0-bf06-19bcf1574220': {
      x: 980,
      y: 241,
      title: 'B先生',
      avatar: 'avatar01.png'
    },
    'bc1988fa-f5e3-405b-a00e-c37dce573c1d': {
      x: 394,
      y: 38,
      title: '銀行',
      avatar: 'avatarbank.png'
    },
    'f5028b71-bbde-4d50-8407-2bc6916537d9': {
      x: 533,
      y: 508,
      title: 'C低階',
      avatar: 'avatar11.png'
    },
    'cf7e3528-2fdc-4237-9f39-4bcfc8b86e37': {
      x: 20,
      y: 310,
      title: '在地咖',
      avatar: 'avatar13.png'
    },
    'd7dd01e3-816d-4975-aa4e-387f479fbf45': {
      x: 273,
      y: 377,
      title: '總代理',
      avatar: 'avatar09.png'
    },
    '13fbe3e3-a175-4399-8b78-81f7ba5fc6f4': {
      x: 526,
      y: 332,
      title: 'A高階',
      avatar: 'avatar07.png'
    },
    '79bf3792-bf54-462e-a143-e0ad6e22e05e': {
      x: 585,
      y: 250,
      title: '職業婦女',
      avatar: 'avatar04.png'
    },
    '33725ba6-2879-4224-a3a9-c533e5d69472': {
      x: 487,
      y: 216,
      title: '出貨中心',
      avatar: 'avatar05.png'
    },
    'c4c25c8e-f659-4db1-9576-3fe5d869ca3b': {
      x: 419,
      y: 274,
      title: '批發商',
      avatar: 'avatar06.png'
    },
    '4dc4bcaf-bb0b-41f4-a991-5148c90b73f5': {
      x: 625,
      y: 150,
      title: 'A女士',
      avatar: 'avatar02.png'
    },
    'a03bf890-6c30-457c-a715-ed1068bfc94b': {
      x: 391,
      y: 134,
      title: '信用卡',
      avatar: 'avatar03.png'
    },
    '23f2f858-aacc-4b00-aa1c-eb1de193b649': {
      x: 980,
      y: 310,
      title: 'D員工',
      avatar: 'avatar10.png'
    },
    '3db7f0d1-6a8e-4491-a6cd-abb235656937': {
      x: 632,
      y: 390,
      title: 'B中階',
      avatar: 'avatar08.png'
    }
  },
  links: [
    { source: 'bc1988fa-f5e3-405b-a00e-c37dce573c1d', target: 'e41a984d-f652-4b59-a66d-f05227d9b9b9', from: 'left', to: 'top', action: '金流' },
    { source: 'e41a984d-f652-4b59-a66d-f05227d9b9b9', target: 'a03bf890-6c30-457c-a715-ed1068bfc94b', from: 'right', to: 'left', action: '金流' },
    { source: 'a03bf890-6c30-457c-a715-ed1068bfc94b', target: '33725ba6-2879-4224-a3a9-c533e5d69472', from: 'right', to: 'top', action: '第三方' },
    { source: '33725ba6-2879-4224-a3a9-c533e5d69472', target: 'cb044608-36f5-4fc0-bf06-19bcf1574220', from: 'top', to: 'left', action: '出貨' },
    { source: '33725ba6-2879-4224-a3a9-c533e5d69472', target: '4dc4bcaf-bb0b-41f4-a991-5148c90b73f5', from: 'top', to: 'left', action: '出貨' },
    { source: '33725ba6-2879-4224-a3a9-c533e5d69472', target: 'ec34d009-2b96-4e1e-9f91-be1e6830f9ce', from: 'top', to: 'left', action: '出貨' },
    { source: '33725ba6-2879-4224-a3a9-c533e5d69472', target: '79bf3792-bf54-462e-a143-e0ad6e22e05e', from: 'right', to: 'left', action: '出貨' },
    { source: 'c4c25c8e-f659-4db1-9576-3fe5d869ca3b', target: '33725ba6-2879-4224-a3a9-c533e5d69472', from: 'top', to: 'left', action: '出貨' },
    { source: 'd7dd01e3-816d-4975-aa4e-387f479fbf45', target: 'c4c25c8e-f659-4db1-9576-3fe5d869ca3b', from: 'top', to: 'left', action: '出貨' },
    { source: '40098552-d840-4ea4-be73-a2c78043e759', target: 'd7dd01e3-816d-4975-aa4e-387f479fbf45', from: 'top', to: 'left', action: '出貨' },
    { source: 'cf7e3528-2fdc-4237-9f39-4bcfc8b86e37', target: '40098552-d840-4ea4-be73-a2c78043e759', from: 'right', to: 'left', action: '出貨' },
    { source: '13fbe3e3-a175-4399-8b78-81f7ba5fc6f4', target: 'd7dd01e3-816d-4975-aa4e-387f479fbf45', from: 'left', to: 'right', action: '管理' },
    { source: '13fbe3e3-a175-4399-8b78-81f7ba5fc6f4', target: '3db7f0d1-6a8e-4491-a6cd-abb235656937', from: 'right', to: 'top', action: '管理' },
    { source: '3db7f0d1-6a8e-4491-a6cd-abb235656937', target: 'f5028b71-bbde-4d50-8407-2bc6916537d9', from: 'left', to: 'top', action: '管理' },
    { source: 'f5028b71-bbde-4d50-8407-2bc6916537d9', target: '23f2f858-aacc-4b00-aa1c-eb1de193b649', from: 'right', to: 'left', action: '管理' }
  ]
}
// res.nodes = { 'e41a984d-f652-4b59-a66d-f05227d9b9b9': { x: -480, y: -49, title: '物流', avatar: 'avatarairplane.png' }, '40098552-d840-4ea4-be73-a2c78043e759': { x: -68, y: 216, title: '採購', avatar: 'avatar12.png' }, 'ec34d009-2b96-4e1e-9f91-be1e6830f9ce': { x: 325, y: -79, title: 'A先生', avatar: 'avatar11.png' }, 'cb044608-36f5-4fc0-bf06-19bcf1574220': { x: 480, y: -49, title: 'B先生', avatar: 'avatar01.png' }, 'bc1988fa-f5e3-405b-a00e-c37dce573c1d': { x: -106, y: -252, title: '銀行', avatar: 'avatarbank.png' }, 'f5028b71-bbde-4d50-8407-2bc6916537d9': { x: 33, y: 218, title: 'C低階', avatar: 'avatar11.png' }, 'cf7e3528-2fdc-4237-9f39-4bcfc8b86e37': { x: -480, y: 20, title: '在地咖', avatar: 'avatar13.png' }, 'd7dd01e3-816d-4975-aa4e-387f479fbf45': { x: -227, y: 87, title: '總代理', avatar: 'avatar09.png' }, '13fbe3e3-a175-4399-8b78-81f7ba5fc6f4': { x: 26, y: 42, title: 'A高階', avatar: 'avatar07.png' }, '79bf3792-bf54-462e-a143-e0ad6e22e05e': { x: 85, y: -40, title: '職業婦女', avatar: 'avatar04.png' }, '33725ba6-2879-4224-a3a9-c533e5d69472': { x: -13, y: -74, title: '出貨中心', avatar: 'avatar05.png' }, 'c4c25c8e-f659-4db1-9576-3fe5d869ca3b': { x: -81, y: -16, title: '批發商', avatar: 'avatar06.png' }, '4dc4bcaf-bb0b-41f4-a991-5148c90b73f5': { x: 125, y: -140, title: 'A女士', avatar: 'avatar02.png' }, 'a03bf890-6c30-457c-a715-ed1068bfc94b': { x: -109, y: -156, title: '信用卡', avatar: 'avatar03.png' }, '23f2f858-aacc-4b00-aa1c-eb1de193b649': { x: 480, y: 20, title: 'D員工', avatar: 'avatar10.png' }, '3db7f0d1-6a8e-4491-a6cd-abb235656937': { x: 132, y: 100, title: 'B中階', avatar: 'avatar08.png' } }

// console.log(JSON.stringify(Object.fromEntries(Object.entries(res.nodes).map(([key, val]) => {
//   const v = Object.assign({}, { ...val, x: val.x - 500, y: val.y - 290 })
//   return [key, v]
// }))))

function getData () {
  return new Promise((resolve, reject) => {
    resolve(res)
  })
}
