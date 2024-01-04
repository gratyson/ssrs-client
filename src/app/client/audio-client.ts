import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, catchError, map, of } from "rxjs";
import { handleError } from "./client-util";

const GET_AUDIO_URL: string = "audio/audio";
const GET_AUDIO_FILES_FOR_WORD_URL: string = "audio/getAudioFilesForWord";
const GET_AUDIO_FILES_FOR_WORD_BATCH_URL: string = "audio/getAudioFilesForWordBatch";
const SAVE_AUDIO_MULTIPLE_URL: string = "audio/saveAudioBatch";
const DELETE_AUDIO_URL: string = "audio/deleteAudio";

@Injectable({providedIn: "root"})
export class AudioClient {

    httpGetOptions = { headers: new HttpHeaders({ "Content-Type": "application/json", "Accept": "application/json" }) };
    httpSaveOptions = { headers: new HttpHeaders({ "Accept": "application/json" }) };

    constructor(private httpClient: HttpClient) {}

    public getAudioPath(wordId: string, audioFileName: string): string {
        let params = new URLSearchParams();
        params.append("wordId", wordId);
        params.append("audioFileName" , audioFileName);

        const url: string = environment.REST_ENDPOINT_URL + GET_AUDIO_URL;
        
        return `${url}?${params}`;
    }

    public getAudioFileNamesForWord(wordId: string): Observable<string[]> {
        let params = new URLSearchParams();
        params.append("wordId", wordId);

        const url: string = environment.REST_ENDPOINT_URL + GET_AUDIO_FILES_FOR_WORD_URL;

        return this.httpClient.get<string[]>(`${url}?${params}`, this.httpGetOptions).pipe(catchError(handleError<string[]>("getAudioFileNamesForWord")));
    }

    public getAudioFileNamesForWordsBatch(wordIds: string[]): Observable<{[k:string]: string[]}> {
        const url: string = environment.REST_ENDPOINT_URL + GET_AUDIO_FILES_FOR_WORD_BATCH_URL;

        return this.httpClient.post<{[k:string]: string[]}>(`${url}`, JSON.stringify(wordIds), this.httpGetOptions).pipe(catchError(handleError<{[k:string]: string[]}>("getAudioFileNamesForWordsBatch", {})));
    }

    public saveAudio(wordId: string, audioFile: File): Observable<string> {
        return this.saveAudioBatch([wordId], [audioFile]).pipe(map<{[k:string]: string[]},string>(savedFiles => savedFiles[wordId] ? savedFiles[wordId][0] : ""));
    }

    public saveAudioBatch(wordIds: string[], audioFiles: File[]): Observable<{[k:string]: string[]}> {
        const url: string = environment.REST_ENDPOINT_URL + SAVE_AUDIO_MULTIPLE_URL;

        let formData: FormData = new FormData();
        formData.append("wordIds", new Blob([JSON.stringify(wordIds)], { type: "application/json" }));
        for(let i = 0; i < audioFiles.length; i++) {
            formData.append("files[]", audioFiles[i]);
        }

        return this.httpClient.put<{[k:string]: string[]}>(`${url}`, formData, this.httpSaveOptions).pipe(catchError(handleError<{[k:string]: string[]}>("saveAudioBatch", {})));
    }

    public deleteAudio(wordId: string, audioFileName: string): Observable<string> {
        const url: string = environment.REST_ENDPOINT_URL + DELETE_AUDIO_URL;

        return this.httpClient.post<DeleteResponse>(`${url}`, JSON.stringify({ "wordId": wordId, "audioFileName": audioFileName}), this.httpGetOptions)
            .pipe(catchError(handleError<DeleteResponse>("deleteAudio", { fileDeleted: "" })))
            .pipe(map(deleteResponse => deleteResponse.fileDeleted));;
    }

    private getFileExtension(fileName: string): string {
        const extensionSeperatorPos = fileName.lastIndexOf(".");
        if (extensionSeperatorPos > 0) {
            return fileName.substring(extensionSeperatorPos + 1);
        }
        return "";
    }
}

interface DeleteResponse {
    fileDeleted: string;
}