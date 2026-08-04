package com.pawpals.backend.pet;

import com.pawpals.backend.auth.RequestUser;
import com.pawpals.backend.pet.dto.CreatePetRequest;
import com.pawpals.backend.pet.dto.PetResponse;
import com.pawpals.backend.pet.dto.PhotoResponse;
import com.pawpals.backend.pet.dto.UpdatePetRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/pets")
@RequiredArgsConstructor
public class PetsController {

  private final PetsService petsService;

  @PostMapping
  @PreAuthorize("hasAuthority('ROLE_OWNER')")
  public PetResponse create(@Valid @RequestBody CreatePetRequest dto, @AuthenticationPrincipal RequestUser user) {
    return petsService.create(dto, user.userId());
  }

  @PatchMapping("/{petId}")
  public PetResponse update(
      @PathVariable String petId, @Valid @RequestBody UpdatePetRequest dto, @AuthenticationPrincipal RequestUser user) {
    return petsService.update(petId, dto, user.userId());
  }

  @GetMapping("/{petId}")
  public PetResponse findOne(@PathVariable String petId) {
    return petsService.findOne(petId);
  }

  @PostMapping("/{petId}/photos")
  public PhotoResponse addPhoto(
      @PathVariable String petId,
      @AuthenticationPrincipal RequestUser user,
      @RequestPart("file") MultipartFile file,
      @RequestParam(defaultValue = "closeup") String kind,
      @RequestParam(defaultValue = "0") int sortOrder) {
    return petsService.addPhoto(petId, user.userId(), file, kind, sortOrder);
  }

  @DeleteMapping("/{petId}/photos/{photoId}")
  public void deletePhoto(
      @PathVariable String petId, @PathVariable String photoId, @AuthenticationPrincipal RequestUser user) {
    petsService.deletePhoto(petId, photoId, user.userId());
  }
}
