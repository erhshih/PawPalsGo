package com.pawpals.backend.pet;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhotoRepository extends JpaRepository<Photo, String> {

  List<Photo> findByPet_IdOrderBySortOrderAsc(String petId);

  int countByPet_Id(String petId);
}
