package com.gaurav.signaldesk.source;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/sources")
public class SourceController {
  private final SourceRepository repo;
  public SourceController(SourceRepository repo){this.repo=repo;}
  @GetMapping public List<Source> list(){return repo.findAll();}
  @PostMapping @ResponseStatus(HttpStatus.CREATED) public Source create(@Valid @RequestBody CreateSource request){return repo.save(new Source(request.name(),request.type(),request.url()));}
  public record CreateSource(@NotBlank String name,@NotBlank String type,@NotBlank String url){}
}
