package com.pawpals.backend.pet;

import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.config.AppProperties;
import com.pawpals.backend.pet.dto.CreatePetRequest;
import com.pawpals.backend.pet.dto.PetResponse;
import com.pawpals.backend.pet.dto.PhotoResponse;
import com.pawpals.backend.pet.dto.UpdatePetRequest;
import com.pawpals.backend.user.UserRepository;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class PetsService {

  private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png");
  private static final int MAX_PHOTOS = 5;

  private final PetRepository petRepository;
  private final PhotoRepository photoRepository;
  private final UserRepository userRepository;
  private final AppProperties appProperties;

  public PetResponse create(CreatePetRequest dto, String ownerId) {
    Pet pet = new Pet();
    pet.setOwner(userRepository.getReferenceById(ownerId));
    pet.setName(dto.name());
    pet.setBreed(dto.breed());
    pet.setBio(dto.bio());
    pet.setTags(dto.tags());
    pet.setBirthDate(dto.birthDate());
    pet = petRepository.save(pet);
    return PetResponse.from(pet, List.of());
  }

  public PetResponse update(String petId, UpdatePetRequest dto, String userId) {
    Pet pet = requireOwnedPet(petId, userId);
    if (dto.name() != null) pet.setName(dto.name());
    if (dto.breed() != null) pet.setBreed(dto.breed());
    if (dto.bio() != null) pet.setBio(dto.bio());
    if (dto.tags() != null) pet.setTags(dto.tags());
    if (dto.birthDate() != null) pet.setBirthDate(dto.birthDate());
    pet = petRepository.save(pet);
    return PetResponse.from(pet, photosOf(petId));
  }

  public PetResponse findOne(String petId) {
    Pet pet = petRepository.findById(petId).orElseThrow(() -> ApiException.notFound("PET_NOT_FOUND"));
    return PetResponse.from(pet, photosOf(petId));
  }

  public PhotoResponse addPhoto(String petId, String userId, MultipartFile file, String kind, int sortOrder) {
    Pet pet = requireOwnedPet(petId, userId);
    if (photoRepository.countByPet_Id(pet.getId()) >= MAX_PHOTOS) {
      throw ApiException.unprocessable("MAX_PHOTOS_REACHED");
    }
    if (file == null || file.isEmpty()) {
      throw ApiException.unprocessable("FILE_REQUIRED");
    }
    if (!ALLOWED_TYPES.contains(file.getContentType())) {
      throw ApiException.unprocessable("INVALID_FILE_TYPE");
    }

    String ext = extensionOf(file.getOriginalFilename());
    String filename = System.currentTimeMillis() + ext;
    Path dir = Path.of(appProperties.uploads().dir(), "pets", petId).toAbsolutePath();
    try {
      Files.createDirectories(dir);
      file.transferTo(dir.resolve(filename));
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }

    Photo photo = new Photo();
    photo.setPet(pet);
    photo.setUrl("/uploads/pets/" + petId + "/" + filename);
    photo.setKind(PhotoKind.valueOf(kind));
    photo.setSortOrder(sortOrder);
    return PhotoResponse.from(photoRepository.save(photo));
  }

  public void deletePhoto(String petId, String photoId, String userId) {
    requireOwnedPet(petId, userId);
    Photo photo = photoRepository.findById(photoId).orElseThrow(() -> ApiException.notFound("PHOTO_NOT_FOUND"));

    Path filePath = Path.of(".", photo.getUrl()).normalize().toAbsolutePath();
    try {
      Files.deleteIfExists(filePath);
    } catch (IOException ignored) {
      // best-effort cleanup, matches Nest's fs.existsSync + unlinkSync guard
    }
    photoRepository.delete(photo);
  }

  private Pet requireOwnedPet(String petId, String userId) {
    Pet pet = petRepository.findById(petId).orElseThrow(() -> ApiException.notFound("PET_NOT_FOUND"));
    if (!pet.getOwnerId().equals(userId)) {
      throw ApiException.forbidden("FORBIDDEN");
    }
    return pet;
  }

  private List<PhotoResponse> photosOf(String petId) {
    return photoRepository.findByPet_IdOrderBySortOrderAsc(petId).stream().map(PhotoResponse::from).toList();
  }

  private String extensionOf(String originalFilename) {
    if (originalFilename == null) return "";
    int dot = originalFilename.lastIndexOf('.');
    return dot >= 0 ? originalFilename.substring(dot) : "";
  }
}
