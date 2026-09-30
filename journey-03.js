import { JOURNEY_02 } from './journey-02.js?v=20260930a';

const rename = (items, prefix) => items.map(item => ({...item,id:`${prefix}-${item.id}`}));
// Same geography on the way back; a different set of visible obstacles.
const returnHazards = [
  [16700,'blocker',448,36,62],[16180,'spikes',482,75,28],
  [15170,'patrol',474,30,36],[14180,'blocker',448,36,62],
  [13180,'spikes',482,80,28],[12200,'patrol',474,30,36],
  [11200,'blocker',448,36,62],[10220,'spikes',482,60,28],
].map(([x,type,y,width,height],index)=>({id:`rescue-return-hazard-${index}`,x,type,y,width,height,
  ...(type==='blocker'||type==='patrol'?{motion:{range:30,period:1900-index*70}}:{})}));
const returnEnergy=[17480,16480,15480,14480,13480,12480,11480,10480,9600]
  .map((x,i)=>({id:`rescue-return-energy-${i}`,type:'energy',x,y:468,width:22,height:22}));
const returnObstacles=[
  {id:'rescue-return-wind-1',type:'wind',x:15700,y:420,width:210,height:90},
  {id:'rescue-return-wind-2',type:'wind',x:11700,y:420,width:210,height:90},
  {id:'rescue-return-speed-1',type:'speedPad',x:16700,y:492,width:96,height:18},
  {id:'rescue-return-speed-2',type:'speedPad',x:13700,y:492,width:96,height:18},
];
export const JOURNEY_03={
  ...JOURNEY_02,id:'journey-03',name:'集市岔路 · 纸巾救援',
  midpointX:9000,deliveryX:9020,returnBudgetMs:90000,
  regions:JOURNEY_02.regions.map(region=>({...region,name:region.id==='riverside'?'学院集市':'星灯长桥'})),
  districts:JOURNEY_02.districts.map(region=>({...region,name:region.id==='riverside'?'学院集市':'星灯长桥'})),
  hazards:JOURNEY_02.hazards.map(hazard => hazard.type === 'collapse' ? {...hazard} : {...hazard,id:`rescue-${hazard.id}`}),
  // Platform IDs and switch IDs stay shared, so one-way groups remain valid.
  energy:rename(JOURNEY_02.energy,'rescue'),coins:rename(JOURNEY_02.coins,'rescue'),
  heartPickups:rename(JOURNEY_02.heartPickups,'rescue'),
  obstacles:rename(JOURNEY_02.obstacles,'rescue'),
  returnRoute:{
    hazards:returnHazards,obstacles:returnObstacles,energy:returnEnergy,
    coins:[],heartPickups:[{id:'rescue-return-heart',type:'heart',x:14650,y:468,width:24,height:24}],
    checkpoints:[[16600,16620],[15800,15950],[13880,14060],[12500,12750],[10460,10680]]
      .map(([x,respawnX])=>({id:`rescue-return-checkpoint-${x}`,x,respawnX})),
    switches:[],
  },
};
