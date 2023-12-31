
export class UUID {
    val: string;

    private constructor(val: string) {
        this.val = val;
    }

    static GenerateNewUUID() : UUID {
        return new UUID(crypto.randomUUID());
    }

    static FromString(val: string) : UUID {
        return new UUID(val);
    }
}