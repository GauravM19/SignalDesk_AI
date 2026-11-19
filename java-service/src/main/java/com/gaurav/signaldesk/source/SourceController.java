package com.gaurav.signaldesk.source;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sources")
public class SourceController {
  private final SourceRepository repo;

  public SourceController(SourceRepository repo) {
    this.repo = repo;
  }

  @GetMapping
  public List<Source> list() {
    return repo.findAll();
  }

  @GetMapping("/{id}")
  public Source get(@PathVariable UUID id) {
    return repo.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source not found"));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Source create(@Valid @RequestBody CreateSource request) {
    return repo.save(new Source(request.name().trim(), request.type().trim(), request.url().trim()));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id) {
    if (!repo.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Source not found");
    }
    repo.deleteById(id);
  }

  public record CreateSource(
    @NotBlank(message = "name is required") String name,
    @NotBlank(message = "type is required") String type,
    @NotBlank(message = "url is required")
    @Size(max = 1000, message = "url must be at most 1000 characters")
    String url
  ) {}
}
