import * as countryService from '../services/countryService.js';

export const createCountry = async (req, res, next) => {
  try {
    const country = await countryService.createCountry(req.body, req.file);
    res.status(201).json({ status: 'success', data: { country } });
  } catch (error) {
    next(error);
  }
};

export const getAllCountries = async (req, res, next) => {
  try {
    const countries = await countryService.getAllCountries();
    res.status(200).json({ status: 'success', data: { countries } });
  } catch (error) {
    next(error);
  }
};

export const getCountryById = async (req, res, next) => {
  try {
    const country = await countryService.getCountryById(req.params.id);
    res.status(200).json({ status: 'success', data: { country } });
  } catch (error) {
    next(error);
  }
};

export const updateCountry = async (req, res, next) => {
  try {
    const country = await countryService.updateCountry(req.params.id, req.body, req.file);
    res.status(200).json({ status: 'success', data: { country } });
  } catch (error) {
    next(error);
  }
};

export const deleteCountry = async (req, res, next) => {
  try {
    await countryService.deleteCountry(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
