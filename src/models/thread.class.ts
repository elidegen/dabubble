export class Thread {
    content: string | undefined;
    creator: string | undefined;
    creatorId: string | undefined;
    channelID: any;

    constructor(obj?: any) {
        this.channelID = obj ? obj.channelID : '';
        this.creator = obj ? obj.creator : '';
        this.creatorId = obj ? obj.creatorId : '';
        this.content = obj ? obj.content : '';
    }

    public toJSON() {
        return {
            channelID: this.channelID,
            creator: this.creator,
            creatorId: this.creatorId,
            content: this.content,
        }
    }
}