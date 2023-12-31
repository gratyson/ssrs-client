import { UUID } from "../util/uuid";

const DEFAULT_IMAGE_PATH = "/assets/images/DefaultDictImage.png";

export class LexiconImageDao {

    GetImagePath(lexiconId: UUID): string {
        return DEFAULT_IMAGE_PATH;
    }
}