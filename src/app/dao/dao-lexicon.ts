import { Japanese } from "../language/language";
import { Lexicon } from "../lexicon/lexicon";
import { UUID } from "../util/uuid";

const TEST_LEXICON = new Lexicon(UUID.FromString("a76be790-3a18-49e8-be3a-1ca29b27cb91"), { ID: 1 }, "Test Dictionary", Japanese, "This is my test dictionary", [
    UUID.FromString("888d63b2-b8a8-459a-8664-bc36273cdcf1"),
    UUID.FromString("02084e83-79b2-48dd-883a-43c3cca997dc"),
]);

export class LexiconDao {

    LoadLexicon(id: UUID) : Lexicon | null {
        if (id.val === "a76be790-3a18-49e8-be3a-1ca29b27cb91") {
            return TEST_LEXICON;
        }
        return null;
    }
}