export interface Word {
    id: string;
    lexiconId: string;
    elements: {[k:string]: string}; 
    attributes: string;
    audioFiles: string[];
    createInstant: Date | null;
    updateInstant: Date | null;
}