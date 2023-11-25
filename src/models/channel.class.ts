export class Channel {
    name: string | undefined;
    description: string | undefined;
    creator: string | undefined
    members: [] | undefined;
    messages: [] | undefined;

    constructor(obj?: any) {
        this.name = obj ? obj.name : '';
        this.description = obj ? obj.description : '';
        this.creator = obj ? obj.creator : '';
        this.members = obj ? obj.members : [];
        this.messages = obj ? obj.messages : [];
    }

    public toJSON() {
        return {
            name:  this.name,
            description: this.description,
            creator: this.creator,
            members:  this.members,
            messages:  this.messages,
        }
    }
}