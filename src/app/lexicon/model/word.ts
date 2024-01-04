export interface Word {
    id: string;
    elements: {[k:string]: string}; 
    attributes: string;
    audioFiles: string[];
}