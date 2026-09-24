// Brief, skippable scenes. These are fictional dialogue for the game world.
export const STORY_SCENES = {
  1: {
    intro: [
      { speaker: '旁白', text: '校园节的最后一天。钟楼敲响闭幕钟前，他们约好去观景台拍一张合照。' },
      { speaker: '董贝贝', text: '说好一起走的，你可别又跑太快！' },
      { speaker: '孟培杰', text: '我先去看看近路。你追上我，我就带你走！' },
    ],
    outro: [
      { speaker: '董贝贝', text: '没心眼，不等我。' },
      { speaker: '孟培杰', text: '知道啦！天桥下就是沿河旧街。下一段，换你选路。' },
    ],
  },
  'journey-02': {
    intro: [
      { speaker: '旁白', text: '两人从天桥走进河岸旧街。钟楼越来越近，街灯也一盏盏亮了起来。' },
      { speaker: '董贝贝', text: '这次说好了，走哪条路我来选。' },
      { speaker: '孟培杰', text: '好啊。前面有条货台近路，不过机关得靠你打开！' },
    ],
    outro: [
      { speaker: '董贝贝', text: '钟楼下也追到你了。下次记得回头等我。' },
      { speaker: '孟培杰', text: '那我们一起去坡上花园，赶上最后一束夕阳。' },
    ],
  },
};

export function getStoryScene(levelId, kind) {
  return STORY_SCENES[levelId]?.[kind] ?? [];
}
