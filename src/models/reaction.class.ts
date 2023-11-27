export class Reaction {
    creator: string | undefined;
    content: string | undefined;
    id: string | undefined;


    constructor(obj?: any) {
        this.creator = obj ? obj.creator : '';
        this.content = obj ? obj.content : '';
        this.id = obj ? obj.id : ''
    }

    public toJSON() {
        return {
            creator:  this.creator,
            content:  this.content,
            id: this.id
        }
    }
}