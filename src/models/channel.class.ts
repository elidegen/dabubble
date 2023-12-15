export class Channel {
    name: string | undefined;
    description: string | undefined;
    creator: string | undefined;
    id: string | undefined;
    members: any = [];
    type: string;

    constructor(obj?: any) {
        this.name = obj ? obj.name : '';
        this.description = obj ? obj.description : '';
        this.creator = obj ? obj.creator : '';
        this.id = obj ? obj.id : '';
        this.members = obj ? obj.members : [];
        this.type = obj ? obj.type : '';
    }

    public toJSON() {
        return {
            name: this.name,
            description: this.description,
            creator: this.creator,
            id: this.id,
            members: this.members,
            type: 'channel',
        }
    }
}