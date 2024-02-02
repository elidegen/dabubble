export class Thread {
    content: string | undefined;
    creator: string | undefined;
    creatorId: string | undefined;
    channelId: any;

    constructor(obj?: any) {
        this.channelId = obj ? obj.channelId : '';
        this.creator = obj ? obj.creator : '';
        this.creatorId = obj ? obj.creatorId : '';
        this.content = obj ? obj.content : '';
    }

    public toJSON() {
        return {
            channelId: this.channelId,
            creator: this.creator,
            creatorId: this.creatorId,
            content: this.content,
        }
    }
}