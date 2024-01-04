import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Meta } from "@angular/platform-browser";
import { Observable, of } from "rxjs";

@Injectable()
export class XhrInterceptor implements HttpInterceptor {

    constructor(private meta: Meta) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const tagName: HTMLMetaElement | null = this.meta.getTag("_csrf_header");
        const token: HTMLMetaElement | null  = this.meta.getTag("_csrf");
        
        if (tagName != null && token !=null) {
            const xhr = req.clone({
                headers: req.headers.set(tagName.content, token.content),
            });
            return next.handle(xhr);
        }

        return next.handle(req);
    }
}