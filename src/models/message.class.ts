export class Message {
    creator: string | undefined;
    creatorId: string | undefined;
    content: string | undefined;
    time: string | undefined;
    date: string | undefined;
    timeInMs: number | undefined;
    id: string | undefined;
    profilePic: string | undefined;
    reaction: any = [];
    reactionCount: any;

    constructor(obj?: any) {
        this.creator = obj ? obj.creator : '';
        this.creatorId = obj ? obj.creatorId : '';
        this.content = obj ? obj.content : '';
        this.time = obj ? obj.time : '';
        this.date = obj ? obj.date : '';
        this.timeInMs = obj ? obj.timeInMs : '';
        this.profilePic = obj ? obj.profilePic : '';
        this.id = obj ? obj.id : '';
        this.reactionCount = obj ? obj.reactionCount : '';
        this.reaction = obj ? obj.reaction : [];
    }

    public toJSON() {
        return {
            creator: this.creator,
            creatorId: this.creatorId,
            content: this.content,
            time: this.time,
            date: this.date,
            timeInMs: this.timeInMs,
            profilePic: this.profilePic,
            reaction: this.reaction,
            reactionCount: this.reactionCount
           
        }
    }
}