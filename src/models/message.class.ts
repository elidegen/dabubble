export class Message {
    creator: string | undefined;
    content: string | undefined;
    date: number | undefined;
    answers: [];
    reactions: [];

    constructor(obj?: any) {
        this.creator = obj ? obj.creator : '';
        this.content = obj ? obj.content : '';
        this.date = obj ? obj.date : null;
        this.answers = obj ? obj.answers : [];
        this.reactions = obj ? obj.reactions : [];
    }

    public toJSON() {
        return {
            creator:  this.creator,
            content:  this.content,
            date:  this.date,
            answers:  this.answers,
            reactions:  this.reactions,
        }
    }
}