export class Message {
    creator: string | undefined;
    content: string | undefined;
    time: string | undefined;
    date: string | undefined;
    timeInMs: number | undefined;
    id: string | undefined;
    profilePic: string | undefined;

    constructor(obj?: any) {
        this.creator = obj ? obj.creator : '';
        this.content = obj ? obj.content : '';
        this.time = obj ? obj.time : '';
        this.date = obj ? obj.date : '';
        this.timeInMs = obj ? obj.timeInMs : '';
        this.profilePic = obj ? obj.profilePic : '';
        this.id = obj ? obj.id : '';
    }

    public toJSON() {
        return {
            creator: this.creator,
            content: this.content,
            time: this.time,
            date: this.date,
            timeInMs: this.timeInMs,
            profilePic: this.profilePic,
            id: this.id
        }
    }
}