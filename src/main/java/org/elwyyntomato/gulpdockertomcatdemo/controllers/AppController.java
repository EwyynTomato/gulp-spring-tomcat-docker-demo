package org.elwyyntomato.gulpdockertomcatdemo.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@RestController
public class AppController {
    @RequestMapping(value = "/", method = {RequestMethod.GET})
    public String helloworld() {
        return "Hello world!";
    }

    @RequestMapping(value = "createFile", method = {RequestMethod.GET})
    public String createFile() throws IOException {
        String filename = UUID.randomUUID().toString();
        File f = new File("/var/media/", filename);
        f.createNewFile();
        return filename;
    }
}
