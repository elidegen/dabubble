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
    threadCount: any;
    lastThreadTime: any;
    channel: any;
    channelID: any;
    viewedBy: any = [];
    messageSelected: boolean;
    file: any;
    mentions: any = [];

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
        this.threadCount = obj ? obj.threadCount : "";
        this.lastThreadTime = obj ? obj.lastThreadTime: "";
        this.viewedBy = obj ? obj.viewedBy : [];
        this.channel = obj = obj ? obj.channel: "";
        this.channelID = obj = obj ? obj.channelID : "";
        this.messageSelected = obj ? obj.message : "";
        this.file = obj ? obj.file: "";
        this.mentions = obj ? obj.mentions: [];
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
            reactionCount: this.reactionCount,
            threadCount: this.threadCount,
            lastThreadTime: this.lastThreadTime,
            channel: this.channel,
            channelID: this.channelID,
            viewedBy: this.viewedBy,
            messageSelected: this.messageSelected,
            file: this.file,
            mentions: this.mentions,
        }
    }
}