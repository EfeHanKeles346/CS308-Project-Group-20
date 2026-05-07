package com.cs308.backend;

import com.cs308.backend.model.Address;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AddressModelTest {

    @Test
    void setsAndGetsFullName() {
        Address address = new Address();
        address.setFullName("Jane Doe");
        assertEquals("Jane Doe", address.getFullName());
    }

    @Test
    void setsAndGetsPhone() {
        Address address = new Address();
        address.setPhone("+90 555 555 55 55");
        assertEquals("+90 555 555 55 55", address.getPhone());
    }

    @Test
    void setsAndGetsLine1() {
        Address address = new Address();
        address.setLine1("123 Main Street");
        assertEquals("123 Main Street", address.getLine1());
    }

    @Test
    void setsAndGetsLine2() {
        Address address = new Address();
        address.setLine2("Apt 4B");
        assertEquals("Apt 4B", address.getLine2());
    }

    @Test
    void setsAndGetsCity() {
        Address address = new Address();
        address.setCity("Istanbul");
        assertEquals("Istanbul", address.getCity());
    }

    @Test
    void setsAndGetsPostalCode() {
        Address address = new Address();
        address.setPostalCode("34000");
        assertEquals("34000", address.getPostalCode());
    }

    @Test
    void setsAndGetsCountry() {
        Address address = new Address();
        address.setCountry("Turkey");
        assertEquals("Turkey", address.getCountry());
    }

    @Test
    void setsAndGetsLabel() {
        Address address = new Address();
        address.setLabel("Home");
        assertEquals("Home", address.getLabel());
    }

    @Test
    void setsAndGetsState() {
        Address address = new Address();
        address.setState("Marmara");
        assertEquals("Marmara", address.getState());
    }

    @Test
    void noArgsConstructorCreatesEmptyAddress() {
        Address address = new Address();
        assertNull(address.getFullName());
        assertNull(address.getCity());
        assertNull(address.getCountry());
    }
}
