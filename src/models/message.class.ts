export class Message {
    creator: string | undefined;
    content: string | undefined;
    time: string | undefined;
    date: string | undefined;
    id: string | undefined;
    profilePic : string | undefined;

    constructor(obj?: any) {
        this.creator = obj ? obj.creator : '';
        this.content = obj ? obj.content : '';
        this.time = obj ? obj.time : '';
        this.date = obj ? obj.date : '';
        this.profilePic = obj ? obj.profilePic : '';
    }

    public toJSON() {
        return {
            creator:  this.creator,
            content:  this.content,
            time:  this.time,
            date:  this.date,
            profilePic:  this.profilePic
        }
    }
}