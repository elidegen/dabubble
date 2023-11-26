export class Message {
    creator: string | undefined;
    content: string | undefined;
    time: string | undefined;
    answers: [];
    reactions: [];
    id: string | undefined;

    constructor(obj?: any) {
        this.creator = obj ? obj.creator : '';
        this.content = obj ? obj.content : '';
        this.time = obj ? obj.time : null;
        this.answers = obj ? obj.answers : [];
        this.reactions = obj ? obj.reactions : [];
    }

    public toJSON() {
        return {
            creator:  this.creator,
            content:  this.content,
            time:  this.time,
            answers:  this.answers,
            reactions:  this.reactions,
        }
    }
}