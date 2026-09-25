// Brief, skippable scenes. These are fictional dialogue for the game world.
export const STORY_SCENES = {
  1: {
    intro: [
      { speaker: '旁白', text: '校园节的最后一天。钟楼敲响闭幕钟前，他们约好去观景台拍一张合照。' },
      { speaker: '董贝贝', text: '说好一起走的，你可别又跑太快！' },
      { speaker: '孟培杰', text: '说好一起拍照，可没说要慢慢走呀。追上我，我就告诉你近路！' },
    ],
    outro: [
      { speaker: '董贝贝', text: '没心眼，不等我。' },
      { speaker: '孟培杰', text: '知道啦，我这不是在天桥等你嘛。沿河旧街那段，换你选路——我看你能领先多久。' },
    ],
  },
  'journey-02': {
    intro: [
      { speaker: '旁白', text: '两人从天桥走进河岸旧街。钟楼越来越近，街灯也一盏盏亮了起来。' },
      { speaker: '董贝贝', text: '这次说好了，走哪条路我来选。' },
      { speaker: '孟培杰', text: '好啊，你选路，我在前面当路标。货台近路有机关，能不能打开就看你啦。' },
    ],
    outro: [
      { speaker: '董贝贝', text: '钟楼下也追到你了。下次记得回头等我。' },
      { speaker: '孟培杰', text: '这次我真不跑了。走吧，一起去坡上花园，别让夕阳先到。' },
    ],
  },
};

export function getStoryScene(levelId, kind) {
  return STORY_SCENES[levelId]?.[kind] ?? [];
}
